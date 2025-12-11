"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  from: "user" | "assistant" | "system";
  text: string;
};

export default function ShiftPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [nextActivity, setNextActivity] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Create a client-side session id when the page first mounts
  useEffect(() => {
    if (!sessionId && typeof crypto !== "undefined") {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);

  // Auto-scroll to the latest message or loading indicator
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, done]);

  async function sendMessage() {
    if (!input.trim() || !sessionId || loading || done) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          userMessage: userText,
          // Only send nextActivity on the first request
          nextActivity: hasStarted ? undefined : nextActivity || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data: {
        assistantMessage?: string;
        currentStep?: string;
        done?: boolean;
        error?: string;
      } = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            from: "system",
            text: "Something went wrong starting this Presence Shift. You can refresh the page and try again.",
          },
        ]);
        setDone(true);
        return;
      }

      if (data.assistantMessage) {
        setMessages((prev) => [
          ...prev,
          { from: "assistant", text: data.assistantMessage as string },
        ]);
      }

      if (data.done) {
        setDone(true);
      }

      setHasStarted(true);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          from: "system",
          text: "I’m not able to continue this Presence Shift right now. You can refresh the page to begin again later.",
        },
      ]);
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || done) return;
    sendMessage();
  }

  const showIntro = !hasStarted;
  const disableInput = loading || done;

  return (
    <main className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Presence Shift Companion
          </span>
          <span className="text-[11px] text-slate-500">
            A brief, guided 5-step ritual
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] text-slate-400">
          Answer · Intend · Focus · Flow · Begin
        </span>
      </header>

      {/* Messages area */}
      <section className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-slate-50">
        {/* Intro card (only before first assistant response) */}
        {showIntro && (
          <div className="rounded-2xl bg-white border border-slate-200 px-3 py-3 text-sm text-slate-700 space-y-2 shadow-sm">
            <p className="font-medium text-slate-900">
              Before we shift, what&apos;s next in your day?
            </p>
            <p className="text-xs text-slate-600">
              For example: &quot;client session&quot;, &quot;deep work&quot;,
              &quot;family time&quot;, or &quot;commute home&quot;.
            </p>

            <div className="mt-2 space-y-1">
              <label className="block text-[11px] font-medium text-slate-600">
                What’s next?
              </label>
              <input
                type="text"
                className="w-full rounded-full border border-slate-300 px-3 py-1.5 text-xs"
                placeholder="One short phrase is enough"
                value={nextActivity}
                onChange={(e) => setNextActivity(e.target.value)}
                suppressHydrationWarning
              />
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate-600">
                And how does your day feel right now?
              </p>
              <p className="text-[11px] text-slate-500">
                You can tap a word below, or type in your own words at the
                bottom.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  "stressed",
                  "scattered",
                  "tired",
                  "anxious",
                  "flat",
                  "on edge",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="px-3 py-1 rounded-full border border-slate-300 text-[11px] text-slate-700 bg-white hover:bg-slate-100"
                    onClick={() =>
                      setInput((prev) => (prev ? `${prev}; ${label}` : label))
                    }
                    suppressHydrationWarning
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversation bubbles */}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={
              m.from === "assistant"
                ? "flex justify-start"
                : m.from === "user"
                  ? "flex justify-end"
                  : "flex justify-center"
            }
          >
            <div
              className={
                m.from === "assistant"
                  ? "max-w-[80%] rounded-2xl px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 shadow-sm"
                  : m.from === "user"
                    ? "max-w-[80%] rounded-2xl px-3 py-2 text-sm text-white bg-blue-600"
                    : "max-w-[80%] text-[11px] text-slate-500 text-center"
              }
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] text-slate-500 bg-white border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              <span>The Companion is with you…</span>
            </div>
          </div>
        )}

        {done && (
          <div className="mt-2 text-[11px] text-slate-500 text-center">
            This Presence Shift is complete. You can close this page or refresh
            to begin again another time.
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-3 border-t border-slate-200 bg-white flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border border-slate-300 rounded-full px-3 py-2 text-sm"
            placeholder={
              done
                ? "This Presence Shift is complete."
                : "Type what's here for you right now…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disableInput}
            suppressHydrationWarning
          />
          <button
            type="submit"
            disabled={disableInput || !input.trim()}
            className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium disabled:opacity-40"
          >
            {done ? "Done" : "Send"}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          This Companion offers presence-shifting guidance, not therapy or
          crisis support.
        </p>
      </form>
    </main>
  );
}
