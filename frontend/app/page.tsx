"use client";

import { useState } from "react";

const STAGES = {
  connecting: { label: "Connecting", emoji: "🔌" },
  searching: { label: "Searching the web", emoji: "🔍" },
  summarizing: { label: "Summarizing findings", emoji: "🧠" },
  emailing: { label: "Sending email", emoji: "📧" },
  done: { label: "Complete", emoji: "✅" },
  error: { label: "Error", emoji: "⚠️" },
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setSummary("");
    setMessage("");
    setStatus("connecting");
    setCopied(false);

    let ws;
    try {
      ws = new WebSocket("ws://127.0.0.1:8000/ws/research");
    } catch {
      setStatus("error");
      setMessage("Couldn't create a connection. Is the backend running?");
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        setStatus("error");
        setMessage("Connection timed out. Check that the backend server is running on port 8000.");
        setLoading(false);
        ws.close();
      }
    }, 8000);

    ws.onopen = () => {
      clearTimeout(timeout);
      ws.send(JSON.stringify({ topic }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      if (data.message) setMessage(data.message);
      if (data.status === "done") {
        setSummary(data.summary);
        setLoading(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      setStatus("error");
      setMessage("Connection error — is the backend running on port 8000?");
      setLoading(false);
    };

    ws.onclose = () => {
      clearTimeout(timeout);
    };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stage = STAGES[status];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
  <svg width="52" height="56" viewBox="0 0 52 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative -mr-1">
    <path d="M8 48V8" stroke="url(#stemGrad)" strokeWidth="9" strokeLinecap="butt" />
    <path d="M42 48V8" stroke="url(#stemGrad)" strokeWidth="9" strokeLinecap="butt" />
    <path d="M8 10L42 46" stroke="url(#trailGrad)" strokeWidth="7.5" strokeLinecap="butt" opacity="0.95" />
    <circle cx="39" cy="43" r="3.6" fill="url(#coreGrad)" />
    <circle cx="39" cy="43" r="7.5" fill="url(#coreGrad)" opacity="0.3" />
    <circle cx="16" cy="4" r="1.8" fill="#e0aaff" />
    <circle cx="24" cy="2" r="1.1" fill="#f0abfc" opacity="0.8" />
    <circle cx="31" cy="5" r="1.4" fill="#e0aaff" opacity="0.9" />
    <line x1="16" y1="4" x2="24" y2="2" stroke="#e0aaff" strokeWidth="0.7" opacity="0.4" />
    <line x1="24" y1="2" x2="31" y2="5" stroke="#e0aaff" strokeWidth="0.7" opacity="0.4" />
    <defs>
      <linearGradient id="stemGrad" x1="0" y1="8" x2="0" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a5b4fc" />
        <stop offset="1" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="trailGrad" x1="8" y1="10" x2="42" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a5b4fc" stopOpacity="0.3" />
        <stop offset="1" stopColor="#f0abfc" />
      </linearGradient>
      <radialGradient id="coreGrad" cx="0.5" cy="0.5" r="0.5">
        <stop stopColor="#f0abfc" />
        <stop offset="1" stopColor="#a5b4fc" />
      </radialGradient>
    </defs>
  </svg>
  <h1
    className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-wide"
    style={{ fontFamily: "var(--font-heading)" }}
  >
    EXLORE
  </h1>
</div>
          <p className="text-slate-400 text-sm sm:text-base">
            Give it a topic. It searches, thinks, and emails you the answer.
          </p>
        </div>

        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-purple-950/50 p-6 sm:p-8 border border-slate-700/50">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. latest advances in quantum computing"
              className="flex-1 bg-slate-800/70 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium px-6 py-3 rounded-xl hover:from-indigo-400 hover:to-purple-400 active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all whitespace-nowrap shadow-lg shadow-indigo-950/50"
            >
              {loading ? "Working..." : "Research"}
            </button>
          </form>

          {status && (
            <div
              className={`flex items-center gap-3 mb-5 px-4 py-3 rounded-xl text-sm border ${
                status === "error"
                  ? "bg-red-950/40 text-red-300 border-red-900/50"
                  : status === "done"
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/50"
                  : "bg-indigo-950/40 text-indigo-300 border-indigo-900/50"
              }`}
            >
              <span className="text-lg">{stage?.emoji}</span>
              <div>
                <div className="font-medium">{stage?.label}</div>
                {message && <div className="text-xs opacity-70">{message}</div>}
              </div>
              {loading && (
                <div className="ml-auto flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                </div>
              )}
            </div>
          )}

          {summary && (
            <div className="relative">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 whitespace-pre-wrap text-slate-200 text-sm leading-relaxed max-h-96 overflow-y-auto">
                {summary}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 bg-slate-700/80 border border-slate-600 rounded-lg px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600 transition"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Built with LangGraph, FastAPI, and Next.js
        </p>
      </div>
    </main>
  );
}