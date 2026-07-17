"use client";

import { useEffect, useRef, useState } from "react";

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
        if (status.taskStatus === "processing" || status.taskStatus === "pending") {
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
    fair: "bg-yellow-400",
    "needs care": "bg-red-500",
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-accent">
          <span className="h-2 w-2 rounded-full bg-accent" /> Skin AI
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Know your skin before you buy.
        </h1>
        <p className="mt-2 max-w-2xl text-white/60">
          Powered by the <strong>YouCam Skin AI API</strong>. Upload a selfie and get a
          Skin Confidence summary across wrinkles, pores, oiliness, radiance, dark
          circles, moisture and your skin type — with product-direction advice.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="block rounded-xl border border-dashed border-white/20 p-6 text-center">
            <input type="file" accept="image/*" onChange={onSelfie} className="hidden" />
            <span className="text-sm text-white/70">Upload a selfie</span>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="selfie" className="mx-auto mt-3 max-h-48 rounded" />
            )}
          </label>
          <button
            onClick={analyze}
            disabled={phase === "analyzing"}
            className="mt-4 w-full rounded-xl bg-accent py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {phase === "analyzing" ? "Analyzing…" : "Analyze my skin"}
          </button>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          {phase === "analyzing" && (
            <p className="mt-3 text-sm text-white/70">{statusText}</p>
          )}
        </section>

        <section>
          {phase === "done" && insight && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-5">
                <div>
                  <div className="text-sm text-white/50">Skin Confidence</div>
                  <div className="text-5xl font-black text-accent-2">
                    {insight.overall}%
                  </div>
                </div>
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
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
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
