"use client";

import { useMemo } from "react";
import Image from "next/image";

type Props = {
  result: any | null;
  imageUrl: string | null;
};

export default function ResultsPanel({ result, imageUrl }: Props) {
  const matches = useMemo(() => (result?.matches?.length ? result.matches : []), [result]);
  const best = useMemo(() => (matches.length ? matches[0] : null), [matches]);

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 shadow-2xl transition-all duration-500 hover:shadow-3xl">
        {imageUrl ? (
          <ImageWithBoxes imageUrl={imageUrl} matches={matches.slice(0, 15)} />
        ) : (
          <div className="grid min-h-[400px] place-items-center p-12">
            <div className="text-center">
              <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 ring-1 ring-white/5 shadow-xl">
                <span className="text-4xl">📷</span>
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl" />
              </div>
              <p className="mt-6 text-base font-semibold text-zinc-200">Upload a shelf image</p>
              <p className="mt-2 max-w-xs text-sm text-zinc-400 leading-relaxed">
                We&apos;ll analyze the photo, detect products, and announce if your brand is present.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-300">Summary</p>
          </div>

          {result?.error ? (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-red-200 leading-relaxed">{result.error}</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <StatRow label="Detection Status" value={result.found ? "✓ Found" : "Not Found"} highlight={result.found} />
              <StatRow label="Matches" value={`${result.matchCount} ${result.matchCount === 1 ? 'match' : 'matches'}`} />
              <StatRow label="Total Detections" value={`${result.allCount} items`} />
              <StatRow label="Search Query" value={result.query ?? "—"} mono />
              {result.usedFallback && (
                <StatRow label="Detection Mode" value="AI Fallback" />
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800 p-4 text-center">
              <p className="text-sm text-zinc-400">
                <span className="text-lg">⏳</span> Waiting for image upload...
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🎯</span>
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-300">Best Match</p>
          </div>

          {best ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-emerald-100 capitalize">{best.class}</p>
                    {best.isFallback && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-500/30">
                        AI
                      </span>
                    )}
                  </div>
                  {best.position && (
                    <p className="mt-2 text-xs text-emerald-300 font-medium">
                      Location: {best.position} side
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400 font-mono">
                    Coords: ({Math.round(best.x)}, {Math.round(best.y)})
                  </p>
                  <p className="text-xs text-zinc-400 font-mono">
                    Size: {Math.round(best.width)}×{Math.round(best.height)}px
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="rounded-xl bg-emerald-500/20 px-3 py-1.5 ring-1 ring-emerald-500/30">
                    <p className="text-sm font-bold text-emerald-100">
                      {(best.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">confidence</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800 p-4 text-center">
              <p className="text-sm text-zinc-400">
                <span className="text-lg">🔍</span> No matching detections found
              </p>
            </div>
          )}
        </div>

        {matches.length > 0 && (
          <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">📋</span>
              <p className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Top {Math.min(matches.length, 8)} Detections
              </p>
            </div>

            <div className="max-h-[300px] space-y-2 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {matches.slice(0, 8).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 text-xs font-bold text-zinc-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-zinc-100 capitalize">{m.class}</p>
                        {m.isFallback && (
                          <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-medium text-amber-300">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">
                        {m.position ? `${m.position} • ` : ""}({Math.round(m.x)}, {Math.round(m.y)})
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-800/60 px-2.5 py-1 group-hover:bg-emerald-500/20 transition-colors">
                    <p className="text-sm font-bold text-zinc-200 group-hover:text-emerald-200">
                      {(m.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight = false, mono = false }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
      highlight
        ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 hover:border-emerald-500/40"
        : "border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700/60"
    }`}>
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-emerald-100" : "text-zinc-100"} ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ImageWithBoxes({ imageUrl, matches }: { imageUrl: string; matches: any[] }) {
  return (
    <div className="relative group">
      <img
        src={imageUrl}
        alt="Uploaded shelf"
        className="block h-auto w-full transition-all duration-500 group-hover:scale-[1.01]"
      />

      {matches.map((m: any, i: number) => {
        const left = m.x - m.width / 2;
        const top = m.y - m.height / 2;
        return (
          <div
            key={i}
            className="absolute rounded-xl border-3 transition-all duration-300 hover:scale-105"
            style={{
              left,
              top,
              width: m.width,
              height: m.height,
              borderWidth: '3px',
              borderColor: 'rgba(16, 185, 129, 0.8)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(16, 185, 129, 0.1)'
            }}
            title={`${m.class} - ${(m.confidence * 100).toFixed(1)}% confidence`}
          >
            <div className="absolute -top-7 left-0 rounded-lg bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
              {m.class} {(m.confidence * 100).toFixed(0)}%
            </div>
          </div>
        );
      })}

      {matches.length > 0 && (
        <div className="absolute top-4 right-4 rounded-xl bg-emerald-500/90 px-4 py-2 text-sm font-bold text-white shadow-xl backdrop-blur-sm ring-2 ring-white/20">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
        </div>
      )}
    </div>
  );
}
