"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function VoiceInput({ value, onChange }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionCtor = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }, []);

  useEffect(() => {
    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognitionCtor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join("");
      onChange(transcript.trim());
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
  }, [SpeechRecognitionCtor, onChange]);

  function toggle() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setListening(true);
      rec.start();
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-900/40 p-6 backdrop-blur-sm shadow-lg">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300 mb-3">
              <span className="text-lg">🔍</span>
              <span>What product or brand should we detect?</span>
            </label>

            <div className="relative">
              <input
                className="w-full rounded-xl border border-zinc-700/50 bg-zinc-950/80 px-4 py-3 pr-24 text-zinc-100 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-zinc-950"
                placeholder="e.g., Sprite, Coca-Cola, Pepsi..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />

              {value && (
                <button
                  onClick={() => onChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-300 hover:bg-zinc-700/60 hover:text-zinc-200 active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>

            {!supported && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <span className="text-lg">⚠️</span>
                <p className="text-xs text-amber-200 leading-relaxed">
                  Voice input is not supported in this browser. Please type your query instead.
                </p>
              </div>
            )}

            {listening && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-3 animate-pulse">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <span className="text-lg">🎤</span>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-100">Listening...</p>
                  <p className="text-xs text-red-200/70">Speak clearly to record your query</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            disabled={!supported}
            className={`group relative shrink-0 overflow-hidden rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 active:scale-95 ${
              supported
                ? listening
                  ? "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-100 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20"
                  : "bg-zinc-900/80 text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-800/80 hover:ring-emerald-500/40 hover:text-emerald-200 shadow-lg"
                : "bg-zinc-900/40 text-zinc-500 ring-1 ring-zinc-800 opacity-50 cursor-not-allowed"
            }`}
          >
            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {listening ? (
                <>
                  <span className="text-lg">⏹</span>
                  Stop
                </>
              ) : (
                <>
                  <span className="text-lg">🎙️</span>
                  Speak
                </>
              )}
            </span>

            {!listening && supported && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            )}
          </button>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 p-3">
          <span className="text-sm">💡</span>
          <p className="text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-300">Pro tip:</span> Speak the exact brand name for best results.
            Try "Sprite" instead of "green soda can".
          </p>
        </div>
      </div>
    </div>
  );
}
