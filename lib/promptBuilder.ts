import { PresenceStep, SessionState } from "./types";
import { getPresenceConfig } from "./config";

/**
 * Arguments for building a Presence Shift prompt for the LLM.
 */
interface BuildPromptArgs {
  /**
   * The current step of the Presence Shift ritual.
   */
  step: PresenceStep;

  /**
   * The server-side state for this session.
   */
  session: SessionState;

  /**
   * The latest message from the user.
   */
  userMessage: string;
}

/**
 * Build a step-specific prompt for the Presence Shift Companion.
 *
 * The returned string is intended to be passed as a single `input` string
 * to the OpenAI Responses API (or similar). The model is instructed to
 * output a JSON object that the backend can parse and use to drive the
 * next step in the ritual.
 */
export function buildPromptForStep({
  step,
  session,
  userMessage,
}: BuildPromptArgs): string {
  const config = getPresenceConfig();

  // If the session is already DONE, do not build a new prompt.
  if (step === "DONE") {
    return JSON.stringify({
      error:
        "The Presence Shift session is already complete. No further model output is required.",
    });
  }

  const stepsConfig = config.steps as Record<
    string,
    { description: string; script: string; maxTurns?: number }
  >;

  const stepConfig = stepsConfig[step];

  if (!stepConfig) {
    return JSON.stringify({
      error: `Unknown Presence Shift step: ${step}`,
    });
  }

  const brandTone = config.brandVoice?.tone ?? "calm, grounded, warm";
  const doGuidelines =
    config.brandVoice?.guidelines?.do?.join("; ") ??
    "Use short, simple sentences; invite, don’t command; stay present-focused.";
  const dontGuidelines =
    config.brandVoice?.guidelines?.dont?.join("; ") ??
    "Do not diagnose; do not promise outcomes; do not offer crisis support.";

  const feelingSummary = session.userFeelingRaw ?? "";
  const nextActivitySummary = session.nextActivityRaw ?? "";

  const systemPart = `
You are the Presence Shift Companion, a calm, structured presence coach.
You always guide users through The Presence Shift®: Answer → Intend → Focus → Flow → Begin.
You are not a therapist and do not provide diagnosis, treatment, or crisis support.

Tone and style:
- Overall tone: ${brandTone}
- Do: ${doGuidelines}
- Don't: ${dontGuidelines}

Always:
- Keep responses short and suitable for a 2–5 minute interaction.
- Ask exactly one focused question OR invite exactly one micro-action at the end.
- Use simple, everyday language without jargon.
- Normalize experience without pathologizing.
  `.trim();

  const stepPart = `
Current Presence Shift step: ${step}
Step description: ${stepConfig.description}
Step script (guidelines): ${stepConfig.script}

User feeling summary (first description of how their day feels, if any):
${feelingSummary || "(none yet)"}

Next activity summary (what's next in their day, if any):
${nextActivitySummary || "(none yet)"}

User's latest message:
"${userMessage}"
  `.trim();

  const transitionRules = `
Step transition rules:
- Valid forward transitions:
  - ANSWER → INTEND
  - INTEND → FOCUS
  - FOCUS → FLOW
  - FLOW → BEGIN
  - BEGIN → DONE
- You may keep the same step for one or two short exchanges if it feels helpful.
- Do NOT go backward to a previous step.
- Do NOT skip more than one step forward at a time.
- Only move to DONE from BEGIN (or if the user clearly indicates they are finished).
  `.trim();

  const taskPart = `
Your task:
1. Respond in the brand voice and within the current step's description and script.
2. Focus on the present moment and the user's next small step, not on analyzing their past.
3. Ask exactly ONE clear question or invite ONE micro-action at the end of your message.
4. Decide whether to:
   - Stay in the current step, or
   - Move forward to the next step as described in the transition rules.

!!CRITICAL OUTPUT FORMAT REQUIREMENTS!!

YOU MUST OUTPUT ONLY VALID JSON. NO EXPLANATIONS. NO MARKDOWN. NO TEXT BEFORE OR AFTER THE JSON.

Your entire response must be a single JSON object with this EXACT structure:

{
  "assistantMessage": "your message to the user, plain text",
  "nextStep": "ANSWER",
  "notesUpdate": {
    "answer": "brief note"
  }
}

VALID nextStep VALUES ONLY: "ANSWER", "INTEND", "FOCUS", "FLOW", "BEGIN", "DONE"

Example response for ANSWER step:
{
  "assistantMessage": "It's okay to feel stressed. That makes sense. Stress can show up in different ways. What feels most present for you right now—in your body, in your emotions, or in your thoughts?",
  "nextStep": "ANSWER",
  "notesUpdate": {
    "answer": "stressed"
  }
}

Example response transitioning to INTEND:
{
  "assistantMessage": "I hear you. You're feeling scattered and there's a lot of pressure. Before you step into your client session, what would help you feel most present? What's one intention you'd like to set?",
  "nextStep": "INTEND",
  "notesUpdate": {
    "answer": "scattered, pressured before client work"
  }
}

Guidelines for JSON fields:
- "assistantMessage": A short, compassionate response (2-4 sentences) that reflects what the user shared and ends with ONE clear question or micro-instruction. Use plain text only, no markdown.
- "nextStep": Must be one of the valid step values listed above, following the transition rules.
- "notesUpdate": Optional object with brief notes about what the user expressed in this exchange.

REMEMBER: Output ONLY the JSON object. Nothing else.
  `.trim();

  const fullPrompt = `
SYSTEM:
${systemPart}

CONTEXT:
${stepPart}

RULES:
${transitionRules}

TASK:
${taskPart}
  `.trim();

  return fullPrompt;
}
