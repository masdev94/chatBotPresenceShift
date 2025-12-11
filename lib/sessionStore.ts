import { SessionState } from "./types";

/**
 * Very simple in-memory session store for the Presence Shift Companion MVP.
 *
 * Notes:
 * - This is NOT suitable for production scale or multi-instance deployments.
 * - All data is lost when the server restarts.
 * - For a production system, replace this with a database or external
 *   key-value store (e.g., Redis, Postgres).
 */

const sessions = new Map<string, SessionState>();

/**
 * Retrieve an existing session by its sessionId.
 */
export async function getSessionState(
  sessionId: string,
): Promise<SessionState | null> {
  return sessions.get(sessionId) ?? null;
}

/**
 * Create or update a session.
 */
export async function saveSessionState(session: SessionState): Promise<void> {
  sessions.set(session.sessionId, session);
}

/**
 * Delete a session when it is no longer needed.
 */
export async function deleteSessionState(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}
