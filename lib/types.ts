export type PresenceStep =
  | "ANSWER"
  | "INTEND"
  | "FOCUS"
  | "FLOW"
  | "BEGIN"
  | "DONE";

export interface SessionNotes {
  /**
   * Short summary of what the user named in the ANSWER step.
   */
  answer?: string;

  /**
   * The user's intention or how they want to show up for what's next.
   */
  intend?: string;

  /**
   * Brief note on the grounding or focus practice they used.
   */
  focus?: string;

  /**
   * How the new presence or quality felt as they stayed with it.
   */
  flow?: string;

  /**
   * The concrete first action they chose to begin what's next.
   */
  begin?: string;
}

/**
 * Core state for a single Presence Shift session.
 * This is stored server-side (in memory or a database) and
 * referenced by a sessionId sent from the client.
 */
export interface SessionState {
  /**
   * Client-generated unique identifier for this session.
   */
  sessionId: string;

  /**
   * The current step in the Presence Shift ritual.
   */
  currentStep: PresenceStep;

  /**
   * ISO timestamp when the session was created.
   */
  createdAt: string;

  /**
   * ISO timestamp when the session was last updated.
   */
  updatedAt: string;

  /**
   * The user's first description of how their day feels.
   * This is raw text, not analyzed or structured.
   */
  userFeelingRaw?: string;

  /**
   * Optional short summary of userFeelingRaw, if you later add
   * an LLM or rule-based summarization pass.
   */
  userFeelingSummary?: string;

  /**
   * The user's description of what's next in their day.
   * Example: "client session", "deep work", "family time".
   */
  nextActivityRaw?: string;

  /**
   * Optional short summary of nextActivityRaw.
   */
  nextActivitySummary?: string;

  /**
   * Step-specific notes captured along the way.
   * These can be used for a session summary at the end.
   */
  notes: SessionNotes;
}
