import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PresenceStep, SessionState } from "@/lib/types";
import { getSessionState, saveSessionState } from "@/lib/sessionStore";
import { buildPromptForStep } from "@/lib/promptBuilder";
import { checkForSafetyFlags } from "@/lib/safety";

/**
 * Initialize the OpenAI client.
 *
 * Make sure you set OPENAI_API_KEY in your environment:
 * - For local development, add it to `.env.local`
 * - In production, configure it in your hosting provider's environment settings
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatRequestBody {
  sessionId: string;
  userMessage: string;
  /**
   * Optional description of what's next in the user's day
   * (e.g., "client session", "deep work") — only sent on the
   * first message of a session.
   */
  nextActivity?: string;
}

interface ChatResponseBody {
  assistantMessage: string;
  currentStep: PresenceStep;
  done: boolean;
}

/**
 * POST /api/chat
 *
 * Main API endpoint for the Presence Shift Companion chat.
 *
 * Responsibilities:
 * - Load or initialize the Presence Shift session state.
 * - Run a simple safety / crisis check on the latest user message.
 * - Build a step-specific prompt grounded in the Presence Shift scripts.
 * - Call OpenAI to generate the next assistant message and step transition.
 * - Update and persist the session state.
 * - Return the assistant message and step info to the client.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ChatResponseBody | { error: string }>> {
  // Basic environment guard
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is not configured with an OpenAI API key. Please set OPENAI_API_KEY.",
      },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const { sessionId, userMessage, nextActivity } = body;

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'sessionId'." },
      { status: 400 },
    );
  }

  if (!userMessage || typeof userMessage !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'userMessage'." },
      { status: 400 },
    );
  }

  // Load existing session or create a new one
  let session: SessionState =
    (await getSessionState(sessionId)) ??
    ({
      sessionId,
      currentStep: "ANSWER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: {},
    } as SessionState);

  // If this is the first time we see a nextActivity, store it
  if (!session.nextActivityRaw && typeof nextActivity === "string") {
    session.nextActivityRaw = nextActivity;
  }

  // Run a simple safety / crisis check on the user's message
  const safety = checkForSafetyFlags(userMessage);

  if (safety.flagged) {
    // Mark session as DONE and return only the safety response
    session.currentStep = "DONE";
    session.updatedAt = new Date().toISOString();
    await saveSessionState(session);

    return NextResponse.json(
      {
        assistantMessage:
          safety.responseText ??
          "It sounds like you might be going through something very intense. I’m not able to help with crises or safety concerns. If you’re in immediate danger, please contact your local emergency number or a crisis line right away.",
        currentStep: session.currentStep,
        done: true,
      },
      { status: 200 },
    );
  }

  // On the very first message, capture how their day feels
  if (!session.userFeelingRaw) {
    session.userFeelingRaw = userMessage;
  }

  // Build a Presence Shift prompt based on the current step
  const prompt = buildPromptForStep({
    step: session.currentStep,
    session,
    userMessage,
  });

  let assistantMessage = "";

  let nextStep: PresenceStep = session.currentStep;

  let notesUpdate: Partial<SessionState["notes"]> | undefined;

  try {
    /**

     * Call the OpenAI Chat Completions API.
     *
     * We pass the entire prompt as a single user message and
     * expect a JSON-only response that we can parse.

     */

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const message = completion.choices[0]?.message;
    const textContent: string =
      typeof message?.content === "string" ? message.content : "";

    if (!textContent) {
      throw new Error("Empty response text from OpenAI.");
    }

    let parsed: {
      assistantMessage: string;
      nextStep: PresenceStep;
      notesUpdate?: Partial<SessionState["notes"]>;
    };

    try {
      parsed = JSON.parse(textContent);

      // Validate required fields
      if (
        !parsed.assistantMessage ||
        typeof parsed.assistantMessage !== "string"
      ) {
        throw new Error("Missing or invalid assistantMessage in response");
      }

      if (!parsed.nextStep || typeof parsed.nextStep !== "string") {
        throw new Error("Missing or invalid nextStep in response");
      }

      // Validate nextStep is a valid PresenceStep
      const validSteps: PresenceStep[] = [
        "ANSWER",
        "INTEND",
        "FOCUS",
        "FLOW",
        "BEGIN",
        "DONE",
      ];
      if (!validSteps.includes(parsed.nextStep as PresenceStep)) {
        console.warn(
          `Invalid nextStep "${parsed.nextStep}", defaulting to current step`,
        );
        parsed.nextStep = session.currentStep;
      }
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      console.error("Raw response:", textContent);

      // If parsing fails, fallback to treating the raw text
      // as the assistant message and end the session.
      parsed = {
        assistantMessage: textContent.substring(0, 500), // Limit length
        nextStep: "DONE",
      } as {
        assistantMessage: string;
        nextStep: PresenceStep;
      };
    }

    assistantMessage = parsed.assistantMessage.trim();
    nextStep = (parsed.nextStep as PresenceStep) || session.currentStep;
    notesUpdate = parsed.notesUpdate;
  } catch (err) {
    // If the OpenAI call fails, gracefully end the session
    console.error("OpenAI error in /api/chat:", err);

    assistantMessage =
      "Something went wrong on my side, so I’ll pause this Presence Shift here. You can refresh the page to begin again later if you’d like.";
    nextStep = "DONE";
  }

  // Update session notes and step
  if (notesUpdate && typeof notesUpdate === "object") {
    session.notes = {
      ...session.notes,
      ...notesUpdate,
    };
  }

  session.currentStep = nextStep;
  session.updatedAt = new Date().toISOString();

  const done = nextStep === "DONE";

  await saveSessionState(session);

  return NextResponse.json(
    {
      assistantMessage:
        assistantMessage ||
        "I’ll pause here for now. You can refresh the page to begin a new Presence Shift when you’re ready.",
      currentStep: session.currentStep,
      done,
    },
    { status: 200 },
  );
}
