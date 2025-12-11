import { getPresenceConfig } from "./config";

/**
 * Result of running a safety check on user input.
 */
export interface SafetyResult {
  /**
   * Whether the message triggered any safety / crisis flags.
   */
  flagged: boolean;

  /**
   * The response text that should be sent to the user when flagged.
   * This should include a brief, compassionate message plus any configured
   * disclaimers or crisis guidance.
   */
  responseText?: string;
}

/**
 * Naive, keyword-based safety check for crisis / self-harm language.
 *
 * This is an MVP implementation and should be treated as a safety net,
 * not a full clinical or production-grade solution.
 *
 * Behavior:
 * - Converts the input to lowercase.
 * - Checks for any configured crisis keywords as simple substring matches.
 * - If any are found, returns `flagged: true` and a standard crisis response
 *   based on the configuration file.
 * - Otherwise returns `flagged: false`.
 *
 * You can later extend this to:
 * - Use more sophisticated pattern matching or ML-based classifiers.
 * - Add severity levels (e.g., warning vs. hard-stop).
 * - Log flagged events for internal review (with appropriate privacy
 *   and compliance considerations).
 */
export function checkForSafetyFlags(text: string): SafetyResult {
  const config = getPresenceConfig();
  const lowered = text.toLowerCase();

  const keywords = config.safety?.keywords ?? [];

  const matchedKeyword = keywords.find((kw) =>
    lowered.includes(kw.toLowerCase())
  );

  if (matchedKeyword) {
    const crisisTemplate = config.safety?.crisisTemplate?.trim() ?? "";
    const disclaimer = config.safety?.disclaimer?.trim() ?? "";

    const parts = [crisisTemplate, disclaimer].filter(Boolean);
    const response = parts.join("\n\n");

    return {
      flagged: true,
      responseText:
        response ||
        "It sounds like you might be going through something very intense. I’m not able to help with crises or safety concerns. If you’re in immediate danger, please contact your local emergency number or a crisis line right away."
    };
  }

  return { flagged: false };
}

/**
 * Utility to append a standard non-therapy / non-crisis disclaimer
 * to an existing message when desired.
 *
 * This is optional and can be used by the API layer to reinforce
 * boundaries in non-crisis situations (e.g., at the start or end
 * of a session).
 */
export function withSafetyDisclaimer(message: string): string {
  const config = getPresenceConfig();
  const disclaimer = config.safety?.disclaimer?.trim();

  if (!disclaimer) {
    return message;
  }

  // Avoid duplicating the disclaimer if it is already included.
  if (message.includes(disclaimer)) {
    return message;
  }

  return `${message}\n\n${disclaimer}`;
}
