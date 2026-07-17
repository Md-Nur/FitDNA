"use client";

import { useEffect, useState } from "react";
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

export default function ProfilePage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

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

  const setDecision = (id: string, d: Decision) => {
    const next = history.map((h) => (h.id === id ? { ...h, decided: d } : h));
    setHistory(next);
    try {
      const prev = JSON.parse(localStorage.getItem("fitdna.profile.v1") ?? "{}");
      localStorage.setItem("fitdna.profile.v1", JSON.stringify({ ...prev, history: next }));
    } catch {}
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Try-ons" value={fit.length} />
            <Stat label="Avg confidence" value={avg ? `${avg}%` : "—"} />
            <Stat label="Kept" value={kept} />
            <Stat label="Rejected" value={rejected} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Fit &amp; Try-On history</h2>
            {fit.length === 0 ? (
              <div className="glass mt-3 flex flex-col items-center rounded-2xl p-8 text-center">
                <ArtEmpty className="h-24 w-28" />
                <p className="mt-2 text-sm text-white/40">
                  No try-ons yet.{" "}
                  <Link href="/try-on" className="text-accent-2 hover:underline">
                    Start one →
                  </Link>
                </p>
              </div>
            ) : (
          <ul className="mt-3 space-y-2">
            {fit.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    <span className="font-medium capitalize">{h.category}</span>{" "}
                    <span className="text-white/40">· {h.recommendedSize}</span>
                  </div>
                  <div className="mt-1 flex gap-3">
                    <SmartImg
                      src={h.selfieThumb}
                      alt="selfie"
                      className="h-16 w-16 rounded"
                    />
                    <SmartImg
                      src={h.garmentThumb}
                      alt="garment"
                      className="h-16 w-16 rounded"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs text-white/60">
                        {h.garmentLabel}
                      </div>
                      {h.resultUrl ? (
                        <SmartImg
                          src={h.resultUrl}
                          alt="try-on result"
                          className="mt-1 h-24 w-24 rounded"
                        />
                      ) : (
                        <p className="mt-1 text-xs text-white/40">
                          No result — try-on didn&apos;t complete.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-accent-2">{h.confidence}%</span>
                  <button
                    onClick={() => setDecision(h.id, "kept")}
                    className={`rounded px-2 py-1 text-xs ${
                      h.decided === "kept" ? "bg-accent-2 text-black" : "bg-white/10"
                    }`}
                  >
                    Keep
                  </button>
                  <button
                    onClick={() => setDecision(h.id, "rejected")}
                    className={`rounded px-2 py-1 text-xs ${
                      h.decided === "rejected" ? "bg-red-500 text-white" : "bg-white/10"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
          </section>
        </>
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
