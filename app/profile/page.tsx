"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SmartImg } from "../components/Feedback";
import { IconProfile, ArtEmpty } from "../components/illustrations";

type Decision = "kept" | "rejected" | "undecided";

interface HistoryItem {
  id: string;
  kind: "fit" | "skin";
  category: "cloth" | "shoes" | "skin";
  brand: string;
  garmentLabel: string;
  selfieThumb?: string;
  garmentThumb?: string;
  recommendedSize: string;
  confidence: number;
  resultUrl?: string;
  decided: Decision;
  createdAt: number;
}

type Filter = "all" | Decision;

export default function ProfilePage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fitdna.profile.v1");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory(raw ? JSON.parse(raw).history ?? [] : []);
    } catch {
      setHistory([]);
    }
    setMounted(true);
  }, []);

  const fit = history.filter((h) => h.kind === "fit");
  const decided = fit.filter((h) => h.decided !== "undecided");
  const avg = decided.length
    ? Math.round(decided.reduce((s, h) => s + h.confidence, 0) / decided.length)
    : 0;
  const kept = fit.filter((h) => h.decided === "kept").length;
  const rejected = fit.filter((h) => h.decided === "rejected").length;

  const filtered = filter === "all" ? fit : fit.filter((h) => h.decided === filter);

  const [lightboxUrl, setLightboxUrl] = useState("");

  const closeLightbox = useCallback(() => setLightboxUrl(""), []);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxUrl, closeLightbox]);

  const setDecision = (id: string, d: Decision) => {
    const next = history.map((h) => (h.id === id ? { ...h, decided: d } : h));
    setHistory(next);
    try {
      const prev = JSON.parse(localStorage.getItem("fitdna.profile.v1") ?? "{}");
      localStorage.setItem("fitdna.profile.v1", JSON.stringify({ ...prev, history: next }));
    } catch {}
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-accent">
          <IconProfile className="h-4 w-4" /> Your FitDNA
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Your <span className="gradient-text">Fit</span> Profile
        </h1>
        <p className="mt-2 text-white/60">
          What FitDNA has learned. Keep or reject to train it.
        </p>
      </header>

      {!mounted ? (
        <p className="text-sm text-white/40">Loading your profile…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Try-ons" value={fit.length} />
            <Stat label="Avg confidence" value={avg ? `${avg}%` : "—"} />
            <Stat label="Kept" value={kept} />
            <Stat label="Rejected" value={rejected} />
          </div>

          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fit &amp; Try-On history</h2>
              {fit.length > 0 && (
                <div className="flex gap-1.5">
                  {(["all", "kept", "rejected", "undecided"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-full px-4 py-1.5 text-xs capitalize ${
                        filter === f ? "bg-accent text-white" : "bg-white/10"
                      }`}
                    >
                      {f === "undecided" ? "Undecided" : f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {fit.length === 0 ? (
              <div className="glass mt-4 flex flex-col items-center rounded-2xl p-12 text-center">
                <ArtEmpty className="h-24 w-28" />
                <p className="mt-3 text-sm text-white/40">
                  No try-ons yet.{" "}
                  <Link href="/try-on" className="text-accent-2 hover:underline">
                    Start one →
                  </Link>
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass mt-4 flex flex-col items-center rounded-2xl p-12 text-center">
                <p className="text-sm text-white/40">
                  No {filter} try-ons found.
                </p>
              </div>
            ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => (
              <div
                key={h.id}
                className="glass rounded-2xl p-5 max-w-sm transition hover:scale-[1.01] hover:bg-white/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium capitalize text-white/80">{h.category}</span>
                    <span className="text-white/30">·</span>
                    <span className="text-accent-2">{h.recommendedSize}</span>
                  </div>
                  <span className="font-mono text-lg text-accent-2">{h.confidence}%</span>
                </div>
                <div className="mt-2 text-xs text-white/40 truncate">
                  {h.garmentLabel}
                </div>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => setLightboxUrl(h.selfieThumb ?? "")}>
                    <SmartImg
                      src={h.selfieThumb}
                      alt="selfie"
                      className="h-20 w-20 rounded-xl object-cover cursor-pointer"
                    />
                  </button>
                  <button onClick={() => setLightboxUrl(h.garmentThumb ?? "")}>
                    <SmartImg
                      src={h.garmentThumb}
                      alt="garment"
                      className="h-20 w-20 rounded-xl object-cover cursor-pointer"
                    />
                  </button>
                  {h.resultUrl ? (
                    <button onClick={() => setLightboxUrl(h.resultUrl!)}>
                      <SmartImg
                        src={h.resultUrl}
                        alt="try-on result"
                        className="h-20 w-20 rounded-xl object-cover cursor-pointer"
                      />
                    </button>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 text-xs text-white/40">
                      No result
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setDecision(h.id, "kept")}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      h.decided === "kept"
                        ? "bg-accent-2 text-black"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => setDecision(h.id, "rejected")}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      h.decided === "rejected"
                        ? "bg-red-500 text-white"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </section>
        </>
      )}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl hover:bg-white/20"
          >
            ✕
          </button>
          <SmartImg
            src={lightboxUrl}
            alt="fullscreen"
            raw
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
          />
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
