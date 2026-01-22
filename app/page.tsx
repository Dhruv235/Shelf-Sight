"use client";

import { useEffect, useMemo, useState } from "react";
import VoiceInput from "@/components/VoiceInput";
import UploadPanel from "@/components/UploadPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { speak } from "@/lib/tts";
import { describeLocation } from "@/lib/location";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [speechOn, setSpeechOn] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const locationText = useMemo(() => {
    if (!result?.found) return "";
    const best = result?.matches?.[0];
    if (!best || !imgSize) return "";
    const loc = describeLocation(best, imgSize.w, imgSize.h);
    return `${loc.phrase}, ${loc.shelf}`;
  }, [result, imgSize]);

  const announcement = useMemo(() => {
    if (!result || result.error) return "";
    const brand = (query || result.query || "that brand").trim();
    if (result.found) return `Yes. I can see ${brand} in front of you.`;
    return `No. I cannot find ${brand} in front of you.`;
  }, [result, query]);

  const fullAnnouncement = useMemo(() => {
    if (!announcement) return "";
    if (!result?.found) return announcement;

    const brand = (query || result.query || "that brand").trim();
    const count = result?.matchCount ?? result?.matches?.length ?? 1;
    const many = count > 1 ? `I found ${count} of them.` : `I found one.`;

    if (locationText) {
      return `Yes. I can see ${brand}. It is ${locationText}. ${many}`;
    }
    return `${announcement} ${many}`;
  }, [announcement, locationText, result, query]);

  useEffect(() => {
    if (!speechOn) return;
    if (!fullAnnouncement) return;
    speak(fullAnnouncement, { rate: 1 });
  }, [fullAnnouncement, speechOn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 w-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.15),transparent_50%)] animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.12),transparent_50%)] animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8 lg:py-6">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10 flex-shrink-0">
              <span className="text-2xl sm:text-3xl">👁️</span>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent blur-md" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent truncate">
                ShelfSight
              </div>
              <div className="text-xs sm:text-sm text-zinc-400 truncate">AI-Powered Accessibility Vision</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => setSpeechOn(v => !v)}
              className={`group relative overflow-hidden rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-95 sm:px-6 sm:py-3 sm:text-base
                ${speechOn
                  ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-100 ring-1 ring-emerald-500/40 hover:ring-emerald-500/60 shadow-lg shadow-emerald-500/10"
                  : "bg-zinc-900/80 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800/80 hover:ring-zinc-700"}
              `}
              aria-pressed={speechOn}
            >
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                {speechOn ? "🔊 Speaker On" : "🔇 Speaker Off"}
              </span>
            </button>

            <button
              onClick={() => fullAnnouncement && speak(fullAnnouncement)}
              disabled={!fullAnnouncement || !speechOn}
              className="group rounded-xl bg-zinc-900/80 px-4 py-2 text-sm font-semibold text-zinc-100 ring-1 ring-zinc-800 transition-all duration-300 hover:bg-zinc-800/80 hover:ring-zinc-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg sm:px-6 sm:py-3 sm:text-base"
            >
              <span className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">🔄 Replay</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <section className="mb-12">
          <div className="relative px-1">
            <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl leading-[1.2]">
              Speak a brand. Upload a shelf photo.
              <br />
              <span
                className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-400 bg-clip-text text-transparent animate-pulse"
                style={{ animationDuration: "3s" }}
              >
                We&apos;ll tell you if it&apos;s there.
              </span>
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl -z-10" />
          </div>

          <p className="mt-6 max-w-3xl text-base text-zinc-400 leading-[1.7] px-1 sm:text-lg">
            Designed for accessibility: the app announces results with voice feedback and provides visual guidance to help you locate products on shelves instantly.
          </p>

          <div className="mt-8 grid gap-4 rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-900/40 p-4 backdrop-blur-sm shadow-2xl sm:grid-cols-3 sm:gap-5 sm:p-6">
            <StatusChip label="Mode" value="Image Detection" icon="🖼️" />
            <StatusChip
              label="Query"
              value={query?.trim() ? query.trim() : "Not set"}
              icon="🔍"
              highlight={!!query?.trim()}
            />
            <StatusChip
              label="Result"
              value={
                result?.error
                  ? "Error"
                  : result
                    ? result.found
                      ? "✓ Detected"
                      : "Not found"
                    : "Pending"
              }
              tone={result?.error ? "bad" : result ? (result.found ? "good" : "neutral") : "neutral"}
              icon={result?.found ? "✓" : result?.error ? "⚠️" : "⏳"}
            />
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8">
            <Card title="1️⃣ Say what you want" subtitle="Use your voice or type a brand name to search" glowColor="emerald">
              <VoiceInput value={query} onChange={setQuery} />
            </Card>

            <Card title="2️⃣ Upload shelf photo" subtitle="We'll analyze the image and announce results" glowColor="sky">
              <UploadPanel
                query={query}
                onResult={(r) => {
                  setResult(r);
                  setIsProcessing(false);
                }}
                onImageSelected={(_, url) => {
                  setImageUrl(url);
                  setResult(null);
                  setIsProcessing(true);

                  if (url) {
                    const img = new Image();
                    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
                    img.src = url;
                  } else {
                    setImgSize(null);
                  }
                }}
              />
            </Card>

            <Card title="📢 Voice Announcement" subtitle="What you'll hear when results are ready" glowColor="teal">
              <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-950/80 to-zinc-900/80 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-5">
                  <span className="text-3xl">💬</span>
                  <div className="flex-1">
                    <p className="text-base font-medium text-zinc-100 leading-[1.7]">
                      {fullAnnouncement ? fullAnnouncement : "Upload an image to generate an announcement."}
                    </p>

                    {result?.found && locationText && (
                      <p className="mt-5 text-base text-emerald-200 leading-[1.7]">
                        Location hint: <span className="font-semibold">{locationText}</span>
                      </p>
                    )}

                    <p className="mt-5 flex items-center gap-2 text-sm text-zinc-500 leading-[1.7]">
                      <span>💡</span>
                      <span>Turn on Speaker, then hit Replay anytime to hear results again</span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card
              title="🎯 Preview & Detections"
              subtitle="Green boxes highlight matching products in your image"
              glowColor="emerald"
              right={
                result && !result.error ? (
                  <span
                    className={`rounded-xl px-5 py-3 text-base font-bold shadow-lg transition-all duration-500 ${
                      result.found
                        ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-100 ring-1 ring-emerald-500/40 animate-pulse shadow-emerald-500/20"
                        : "bg-zinc-900/60 text-zinc-300 ring-1 ring-zinc-700/50"
                    }`}
                    style={{ animationDuration: result.found ? "2s" : "none" }}
                  >
                    {result.found ? "✓ Detected!" : "Not Found"}
                  </span>
                ) : isProcessing ? (
                  <span className="rounded-xl bg-sky-500/20 px-5 py-3 text-base font-bold text-sky-200 ring-1 ring-sky-500/40 animate-pulse">
                    Processing...
                  </span>
                ) : null
              }
            >
              <ResultsPanel result={result} imageUrl={imageUrl} />
            </Card>
          </div>
        </section>
      </main>

      <footer className="mt-24 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="text-base text-zinc-400 leading-[1.6]">
              <span className="font-semibold text-zinc-300">ShelfSight</span> • Accessibility-first vision assistant powered by AI
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 leading-[1.6]">
              <span>Made with</span>
              <span className="text-red-400">❤️</span>
              <span>for accessibility</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
  glowColor = "emerald",
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  glowColor?: "emerald" | "sky" | "teal";
}) {
  const glowColors = {
    emerald: "from-emerald-500/10",
    sky: "from-sky-500/10",
    teal: "from-teal-500/10",
  };

  return (
    <div className="group relative rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-900/40 p-6 backdrop-blur-sm shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-3xl sm:p-8">
      <div
        className={`absolute -inset-px rounded-3xl bg-gradient-to-br ${glowColors[glowColor]} to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 -z-10`}
      />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-zinc-100 leading-[1.3] sm:text-xl">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-zinc-400 leading-[1.6] sm:text-base">{subtitle}</p> : null}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone = "neutral",
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad";
  icon?: string;
  highlight?: boolean;
}) {
  const cls =
    tone === "good"
      ? "bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 text-emerald-100 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
      : tone === "bad"
      ? "bg-gradient-to-br from-red-500/15 to-red-600/10 text-red-100 ring-1 ring-red-500/30 shadow-lg shadow-red-500/10"
      : highlight
      ? "bg-gradient-to-br from-sky-500/15 to-sky-600/10 text-sky-100 ring-1 ring-sky-500/30"
      : "bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 text-zinc-200 ring-1 ring-zinc-800";

  return (
    <div className={`group relative overflow-hidden rounded-2xl px-6 py-6 transition-all duration-300 hover:scale-[1.02] ${cls}`}>
      <div className="flex flex-col items-center justify-center text-center min-h-[70px]">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          {label}
        </div>
        <div className="flex items-center justify-center gap-2 text-base font-bold leading-tight sm:text-lg">
          {icon && <span className="text-base sm:text-lg">{icon}</span>}
          <span className="truncate max-w-[180px]">{value}</span>
        </div>
      </div>

      {tone === "good" && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      )}
    </div>
  );
}
