import Link from "next/link";

export default function HomePage() {
  return (
    <main className="h-full flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-6 bg-white/80 backdrop-blur border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          The Presence Shift Companion
        </h1>

        <p className="text-sm text-slate-700 leading-relaxed">
          A brief, guided 5-step ritual to help you shift your presence for
          what&apos;s next in your day. Designed for real, in-between moments—
          before a session, a deep work block, or a transition at home.
        </p>

        <p className="text-sm text-slate-700">
          You&apos;ll be invited through:{" "}
          <span className="font-medium">
            Answer · Intend · Focus · Flow · Begin
          </span>
          . Most Presence Shifts take about 2–5 minutes.
        </p>

        <Link
          href="/shift"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
        >
          Begin a Presence Shift
        </Link>

        <div className="space-y-1 text-[11px] text-slate-500">
          <p>
            This Companion is not a substitute for therapy, medical care, or
            crisis support.
          </p>

          <p>
            If you are in crisis or concerned about your safety, please contact
            your local emergency number or a crisis line in your area.
          </p>
        </div>
      </div>
    </main>
  );
}
