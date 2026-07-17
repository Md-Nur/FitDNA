"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorBox, Loader, SmartImg } from "../components/Feedback";
import { IconSkin, IconCamera, ScoreRing } from "../components/illustrations";

interface SkinConcern {
  key: string;
  label: string;
  score: number;
  level: "good" | "fair" | "needs care";
  advice: string;
}

interface SkinInsight {
  overall: number;
  skinType?: string;
  concerns: SkinConcern[];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function SkinPage() {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [insight, setInsight] = useState<SkinInsight | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function onSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelfie(f);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    setError("");
    if (!selfie) {
      setError("Upload a clear selfie (face well-lit, no sunglasses).");
      return;
    }
    setPhase("analyzing");
    setStatusText("Uploading & starting skin analysis…");
    try {
      const selfieDataUrl = await readFileAsDataUrl(selfie);
      const startRes = await fetch("/api/skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieDataUrl }),
      });
      if (!startRes.ok) throw new Error((await startRes.json()).error ?? "Skin analysis failed");
      const { taskId } = await startRes.json();

      pollRef.current = setInterval(async () => {
        const s = await fetch(`/api/skin/status?taskId=${taskId}`);
        const status = await s.json();
        if (status.error) {
          clearInterval(pollRef.current!);
          setPhase("error");
          setError(status.error);
          return;
        }
        if (status.taskStatus === "processing" || status.taskStatus === "pending" || status.taskStatus === "running") {
          setStatusText("Analyzing your skin…");
          return;
        }
        if (status.taskStatus === "error") {
          clearInterval(pollRef.current!);
          setPhase("error");
          setError(status.error ?? "Analysis errored");
          return;
        }
        clearInterval(pollRef.current!);
        setInsight(status.insight);
        setPhase("done");
      }, 3000);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const levelColor: Record<SkinConcern["level"], string> = {
    good: "bg-accent-2",
    fair: "bg-accent-soft",
    "needs care": "bg-rose-400",
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-accent">
          <IconSkin className="h-4 w-4" /> Skin AI
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Know your <span className="gradient-text">skin</span> before you buy.
        </h1>
        <p className="mt-2 max-w-2xl text-white/60">
          YouCam scores your skin; FitDNA turns it into a confidence summary.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section className="glass rounded-2xl p-5">
          <label className="flex flex-col items-center rounded-xl border border-dashed border-white/20 p-6 text-center transition hover:border-accent/50">
            <input type="file" accept="image/*" onChange={onSelfie} className="hidden" />
            <IconCamera className="h-8 w-8 text-white/40" />
            <span className="mt-1 text-sm text-white/70">Upload a selfie</span>
            {preview && (
              <SmartImg src={preview} alt="selfie" className="mt-3 h-48 w-48 rounded" />
            )}
          </label>
          <button
            onClick={analyze}
            disabled={phase === "analyzing"}
            className="mt-4 w-full rounded-xl bg-accent py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {phase === "analyzing" ? "Analyzing…" : "Analyze my skin"}
          </button>
          <ErrorBox raw={error} onRetry={phase === "error" ? analyze : undefined} />
          {phase === "analyzing" && (
            <div className="mt-3">
              <Loader text={statusText} />
            </div>
          )}
        </section>

        <section>
          {phase === "done" && insight && (
            <div className="glass animate-pop rounded-2xl p-5">
              <div className="flex items-center gap-5">
                <ScoreRing value={insight.overall} label="Skin" />
                {insight.skinType && (
                  <div className="rounded-xl bg-white/10 px-4 py-2 text-sm">
                    <div className="text-white/50">Skin type</div>
                    <div className="font-semibold capitalize">{insight.skinType}</div>
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-sm font-semibold text-white/70">
                Concerns (worst first)
              </h3>
              <ul className="mt-3 space-y-3">
                {insight.concerns.map((c) => (
                  <li key={c.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{c.label}</span>
                      <span className="font-mono text-white/70">{c.score}</span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-white/10">
                      <div
                        className={`h-full rounded ${levelColor[c.level]}`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-white/50">{c.advice}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {phase === "idle" && (
            <div className="glass rounded-2xl p-5 text-sm text-white/60">
              Upload a selfie to see your Skin Confidence summary. The raw YouCam scores
              are translated into plain-language advice so you can shop skincare that
              fits your face.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
