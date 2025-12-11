"use client";

import { useEffect, useState } from "react";

type MessageState = {
  type: "info" | "error" | "success";
  text: string;
} | null;

type RitualVersionSummary = {
  id: string;
  versionNumber: number;
  isActive: boolean;
  label: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
};

type AdminConfigPayload = {
  ritualSlug: string;
  config: unknown;
  versions: RitualVersionSummary[];
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rawConfig, setRawConfig] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [ritualSlug, setRitualSlug] = useState<string | null>(null);
  const [versions, setVersions] = useState<RitualVersionSummary[]>([]);
  const [activeTab, setActiveTab] = useState<"editor" | "versions">("editor");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function authenticate() {
    if (!secret) {
      setMessage({
        type: "error",
        text: "Please enter your admin secret",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/config", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        let errorMessage = "Authentication failed";
        try {
          const data = JSON.parse(text);
          if (data && typeof data.error === "string") {
            errorMessage = data.error;
          }
        } catch {
          // ignore
        }

        setMessage({
          type: "error",
          text: errorMessage,
        });
        setLoading(false);
        return;
      }

      let payload: AdminConfigPayload | null = null;
      try {
        payload = JSON.parse(text) as AdminConfigPayload;
      } catch {
        setRawConfig(text);
        setRitualSlug(null);
        setVersions([]);
      }

      if (payload) {
        setRitualSlug(payload.ritualSlug);
        setVersions(payload.versions || []);
        setRawConfig(JSON.stringify(payload.config, null, 2));
      } else {
        setRitualSlug(null);
        setVersions([]);
      }

      setIsAuthenticated(true);
      setMessage({
        type: "success",
        text: "Successfully authenticated",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Network error: " + (err?.message || String(err)),
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!secret || !isAuthenticated) {
      setMessage({
        type: "error",
        text: "Please authenticate first",
      });
      return;
    }

    if (!rawConfig.trim()) {
      setMessage({
        type: "error",
        text: "Config cannot be empty",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawConfig);
      } catch {
        setMessage({
          type: "error",
          text: "Invalid JSON syntax. Please fix errors before saving.",
        });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify(parsed),
      });

      const text = await res.text();
      let payload: any = {};
      try {
        payload = JSON.parse(text);
      } catch {
        // ignore
      }

      if (!res.ok) {
        const errorMessage =
          (payload && typeof payload.error === "string" && payload.error) ||
          "Failed to save configuration";
        setMessage({
          type: "error",
          text: errorMessage,
        });
        setSaving(false);
        return;
      }

      setMessage({
        type: "success",
        text: "Configuration saved successfully!",
      });

      setTimeout(() => authenticate(), 1000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Network error: " + (err?.message || String(err)),
      });
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 sm:px-8 sm:py-10 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-center">
                Admin
              </h1>
              <p className="text-blue-100 text-center text-sm sm:text-base mt-2">
                Presence Shift Companion
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {message && (
                <div
                  className={
                    "rounded-lg px-4 py-3 text-sm border " +
                    (message.type === "error"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : message.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-blue-50 border-blue-200 text-blue-800")
                  }
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Admin Secret
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && authenticate()}
                  className="w-full px-4 py-3 sm:py-3.5 border border-slate-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your admin secret"
                  disabled={loading}
                />
                <p className="text-xs sm:text-sm text-slate-500">
                  Configured in your .env.local file
                </p>
              </div>

              <button
                type="button"
                onClick={authenticate}
                disabled={loading || !secret}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 sm:py-4 rounded-lg text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  "Authenticate & Load Config"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header - Responsive */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 truncate">
                  Admin Panel
                </h1>
                <p className="text-xs text-slate-500 truncate hidden sm:block">
                  {ritualSlug || "Presence Shift Config"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setSecret("");
                setRawConfig("");
                setVersions([]);
              }}
              className="text-xs sm:text-sm text-slate-600 hover:text-slate-900 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Alert Messages - Responsive */}
        {message && (
          <div className="mb-4 sm:mb-6">
            <div
              className={
                "rounded-lg px-3 sm:px-4 py-3 text-xs sm:text-sm border flex items-start space-x-2 sm:space-x-3 " +
                (message.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : message.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-blue-50 border-blue-200 text-blue-800")
              }
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {message.type === "success" ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : message.type === "error" ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              <span className="flex-1">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs - Responsive */}
        <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab("editor")}
            className={
              "flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all " +
              (activeTab === "editor"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900")
            }
          >
            Config Editor
          </button>
          <button
            onClick={() => setActiveTab("versions")}
            className={
              "flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all relative " +
              (activeTab === "versions"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900")
            }
          >
            <span className="hidden sm:inline">Version History</span>
            <span className="sm:hidden">Versions</span>
            {versions.length > 0 && (
              <span className="ml-1.5 sm:ml-2 inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                {versions.length}
              </span>
            )}
          </button>
        </div>

        {/* Editor Tab - Fully Responsive */}
        {activeTab === "editor" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Configuration JSON
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Edit scripts, prompts, and safety text
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <textarea
                  value={rawConfig}
                  onChange={(e) => setRawConfig(e.target.value)}
                  className="w-full h-64 sm:h-96 lg:h-[500px] border border-slate-300 rounded-lg p-3 sm:p-4 text-[11px] sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                  spellCheck={false}
                  placeholder='{"brandVoice": {...}, "safety": {...}, "steps": {...}}'
                />
              </div>
            </div>

            {/* Save Button - Responsive */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                    Save Changes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Create a new version and mark it as active
                  </p>
                </div>
                <button
                  type="button"
                  onClick={saveConfig}
                  disabled={saving || !rawConfig.trim()}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 sm:px-6 py-3 sm:py-3 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 whitespace-nowrap"
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save as New Version"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Versions Tab - Fully Responsive */}
        {activeTab === "versions" && (
          <div className="space-y-3 sm:space-y-4">
            {versions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-12 sm:py-16 text-center">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 mb-3 sm:mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                  No versions yet
                </h3>
                <p className="text-sm text-slate-600">
                  Save your first configuration to create version 1
                </p>
              </div>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className={
                    "bg-white rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md " +
                    (v.isActive
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-slate-200")
                  }
                >
                  <div className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700">
                            Version {v.versionNumber}
                          </span>
                          {v.isActive && (
                            <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              ● ACTIVE
                            </span>
                          )}
                        </div>
                        {v.label && (
                          <h3 className="text-sm sm:text-base font-medium text-slate-900 mb-1 break-words">
                            {v.label}
                          </h3>
                        )}
                        {v.notes && (
                          <p className="text-xs sm:text-sm text-slate-600 mb-3 break-words">
                            {v.notes}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-slate-500">
                          <span className="flex items-center">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="truncate">
                              {formatDate(v.createdAt)}
                            </span>
                          </span>
                          {v.createdBy && (
                            <span className="flex items-center">
                              <svg
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="truncate">{v.createdBy}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
