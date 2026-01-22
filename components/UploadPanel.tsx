"use client";

import { useState, useRef, useEffect } from "react";
import {
  loadCocoModel,
  detectFromUrl,
  matchCocoDetections,
  isModelLoaded,
} from "@/lib/cocoDetect";

type DetectResult = {
  found: boolean;
  matchCount: number;
  matches: any[];
  allCount: number;
  error?: string;
  query?: string;
  usedFallback?: boolean;
  fallbackMatches?: any[];
};

type Props = {
  query: string;
  onResult: (r: DetectResult) => void;
  onImageSelected: (file: File | null, previewUrl: string | null) => void;
};

export default function UploadPanel({ query, onResult, onImageSelected }: Props) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fallbackStatus, setFallbackStatus] = useState<string>("");
  const currentImageUrl = useRef<string | null>(null);

  useEffect(() => {
    // Preload COCO model for fruit/veggie detection
    loadCocoModel().catch(() => {});
  }, []);

  async function runFallbackDetection(imageUrl: string): Promise<any[]> {
    if (!isModelLoaded()) {
      setFallbackStatus("Loading fruit/vegetable detector...");
      await loadCocoModel();
    }

    setFallbackStatus("Scanning for fruits and vegetables...");
    const cocoDetections = await detectFromUrl(imageUrl, 0.35); // Lower threshold for better fruit/veggie detection
    const matched = matchCocoDetections(cocoDetections, query);

    return matched.map((det) => ({
      class: det.class,
      confidence: det.confidence,
      x: det.x,
      y: det.y,
      width: det.width,
      height: det.height,
      position: det.position,
      isFallback: true,
    }));
  }

  async function runDetect(file: File) {
    if (!query.trim()) {
      onResult({
        found: false,
        matchCount: 0,
        matches: [],
        allCount: 0,
        error: "Please enter a brand name or product first before uploading an image.",
      });
      return;
    }

    setBusy(true);
    setFallbackStatus("");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("query", query);

      const imageUrl = URL.createObjectURL(file);
      currentImageUrl.current = imageUrl;

      // Try primary Roboflow detection first (for brand labels)
      const res = await fetch("/api/detect", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        // Primary detection completely failed - try COCO fallback for fruits/veggies
        setFallbackStatus("Primary detection unavailable, trying fruit/vegetable detector...");
        try {
          const fallbackMatches = await runFallbackDetection(imageUrl);
          if (fallbackMatches.length > 0) {
            onResult({
              found: true,
              matchCount: fallbackMatches.length,
              matches: fallbackMatches,
              allCount: fallbackMatches.length,
              query,
              usedFallback: true,
            });
          } else {
            onResult({
              found: false,
              matchCount: 0,
              matches: [],
              allCount: 0,
              error: "No products detected. Try a clearer photo with better lighting, or check if the item is a packaged brand product or fresh produce.",
            });
          }
        } catch {
          onResult({
            found: false,
            matchCount: 0,
            matches: [],
            allCount: 0,
            error: data?.error ?? "Detection failed. Please try again with a clearer image.",
          });
        }
      } else {
        // Primary detection succeeded
        if (data.matchCount > 0) {
          // Found brand label matches - return immediately
          onResult(data);
        } else if (data.allCount > 0) {
          // Detected other products but no match for the query
          // Only try COCO fallback if query might be a fruit/vegetable
          const isFruitVeggieQuery = isFruitOrVegetableQuery(query);
          
          if (isFruitVeggieQuery) {
            setFallbackStatus("No brand labels found, checking for fresh produce...");
            try {
              const fallbackMatches = await runFallbackDetection(imageUrl);
              if (fallbackMatches.length > 0) {
                onResult({
                  ...data,
                  found: true,
                  matchCount: fallbackMatches.length,
                  matches: fallbackMatches,
                  usedFallback: true,
                  fallbackMatches: fallbackMatches,
                });
              } else {
                onResult(data); // Return original "not found" result
              }
            } catch {
              onResult(data);
            }
          } else {
            // Query appears to be a brand - don't use COCO fallback
            onResult(data);
          }
        } else {
          // No detections at all - try COCO as last resort
          setFallbackStatus("No products detected, trying alternative detector...");
          try {
            const fallbackMatches = await runFallbackDetection(imageUrl);
            if (fallbackMatches.length > 0) {
              onResult({
                found: true,
                matchCount: fallbackMatches.length,
                matches: fallbackMatches,
                allCount: fallbackMatches.length,
                query,
                usedFallback: true,
              });
            } else {
              onResult({
                found: false,
                matchCount: 0,
                matches: [],
                allCount: 0,
                error: "No products detected. Try a clearer photo with better lighting.",
              });
            }
          } catch {
            onResult(data);
          }
        }
      }
    } catch (e: any) {
      // Network error - try COCO fallback
      if (currentImageUrl.current) {
        setFallbackStatus("Network error, trying local detection...");
        try {
          const fallbackMatches = await runFallbackDetection(
            currentImageUrl.current
          );
          if (fallbackMatches.length > 0) {
            onResult({
              found: true,
              matchCount: fallbackMatches.length,
              matches: fallbackMatches,
              allCount: fallbackMatches.length,
              query,
              usedFallback: true,
            });
          } else {
            onResult({
              found: false,
              matchCount: 0,
              matches: [],
              allCount: 0,
              error: "No products detected. Try a clearer photo.",
            });
          }
        } catch {
          onResult({
            found: false,
            matchCount: 0,
            matches: [],
            allCount: 0,
            error: e?.message ?? "Detection failed. Please check your connection and try again.",
          });
        }
      } else {
        onResult({
          found: false,
          matchCount: 0,
          matches: [],
          allCount: 0,
          error: e?.message ?? "Unknown error occurred. Please try again.",
        });
      }
    } finally {
      setBusy(false);
      setFallbackStatus("");
    }
  }

  async function onPick(file: File | null) {
    if (!file) return;
    setFileName(file.name);

    const url = URL.createObjectURL(file);
    onImageSelected(file, url);

    await runDetect(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onPick(e.dataTransfer.files[0]);
    }
  }

  return (
    <div
      className={`group relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
        dragActive
          ? "border-emerald-500/60 bg-emerald-500/10"
          : busy
          ? "border-sky-500/40 bg-sky-500/5"
          : "border-zinc-700/50 bg-gradient-to-br from-zinc-900/60 to-zinc-900/40"
      } p-6 backdrop-blur-sm shadow-lg hover:border-zinc-600/60`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {busy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-zinc-950/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-sky-500/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-sky-500" />
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-sky-500/10">
                <span className="text-2xl">🔍</span>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-sky-200">
              {fallbackStatus || "Analyzing image..."}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {fallbackStatus.includes("fruit") || fallbackStatus.includes("vegetable") 
                ? "Checking for fresh produce" 
                : fallbackStatus.includes("fallback") || fallbackStatus.includes("alternative")
                ? "Using backup detector"
                : "Detecting brand labels"}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between md:gap-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900/60 ring-1 ring-zinc-800">
              <span className="text-2xl">📁</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-200">
                {fileName ? "Image selected" : "Upload shelf photo"}
              </p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {fileName || "Drag & drop or click to browse"}
              </p>
              {fileName && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                    <p className="text-xs font-medium text-emerald-200">✓ Ready</p>
                  </div>
                  <button
                    onClick={() => {
                      setFileName(null);
                      onImageSelected(null, null);
                      onResult({
                        found: false,
                        matchCount: 0,
                        matches: [],
                        allCount: 0,
                      });
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <label className="group/btn relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 px-6 py-3 text-sm font-bold text-emerald-100 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:ring-emerald-500/60 hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-lg">{busy ? "⏳" : "📤"}</span>
              {busy ? "Detecting..." : fileName ? "Change file" : "Choose file"}
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 p-3">
            <span className="text-sm">📸</span>
            <div>
              <p className="text-xs font-semibold text-zinc-300">Best practices</p>
              <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                Use clear photos with visible labels/products and good lighting
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 p-3">
            <span className="text-sm">🎯</span>
            <div>
              <p className="text-xs font-semibold text-zinc-300">What we detect</p>
              <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                Brand labels (Sprite, Coke, etc.) & fresh produce (apples, bananas)
              </p>
            </div>
          </div>
        </div>

        {dragActive && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-emerald-500/20 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
                <span className="text-4xl">📥</span>
              </div>
              <p className="mt-4 text-lg font-bold text-emerald-100">Drop image here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to determine if query is likely a fruit/vegetable
function isFruitOrVegetableQuery(query: string): boolean {
  const fruitVeggieKeywords = [
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon', 'pineapple',
    'mango', 'pear', 'peach', 'plum', 'cherry', 'kiwi', 'lemon', 'lime',
    'carrot', 'broccoli', 'tomato', 'potato', 'onion', 'pepper', 'lettuce',
    'cucumber', 'celery', 'spinach', 'cabbage', 'corn', 'peas', 'beans',
    'fruit', 'vegetable', 'veggie', 'produce', 'fresh'
  ];
  
  const normalizedQuery = query.toLowerCase().trim();
  return fruitVeggieKeywords.some(keyword => 
    normalizedQuery.includes(keyword) || keyword.includes(normalizedQuery)
  );
}