"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorBox, Loader, SmartImg } from "../components/Feedback";
import { IconShirt, IconShoe, IconUpload, ScoreRing } from "../components/illustrations";

type Category = "cloth" | "shoes";
type Decision = "kept" | "rejected" | "undecided";

interface FitVerdict {
  recommendedSize: string;
  confidence: number;
  reasons: string[];
  perSize: { size: string; score: number }[];
}

interface BodyState {
  bust: string;
  waist: string;
  hips: string;
  shoulder: string;
  height: string;
  footLength: string;
}

interface HistoryItem {
  id: string;
  kind: "fit" | "skin";
  category: Category | "skin";
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

const BRANDS = ["default", "zara"];

type Unit = "cm" | "in";

function toCm(value: string, unit: Unit): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return undefined;
  return unit === "in" ? Math.round(n * 2.54 * 10) / 10 : n;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ProfileSummary({
  history,
  decide,
}: {
  history: HistoryItem[];
  decide: (id: string, d: Decision) => void;
}) {
  const fit = history.filter((h) => h.kind === "fit");
  const decided = fit.filter((h) => h.decided !== "undecided");
  const avg = decided.length
    ? Math.round(decided.reduce((s, h) => s + h.confidence, 0) / decided.length)
    : 0;
  const kept = fit.filter((h) => h.decided === "kept").length;
  const rejected = fit.filter((h) => h.decided === "rejected").length;
  const sizeCount: Record<string, number> = {};
  fit.forEach((h) => (sizeCount[h.recommendedSize] = (sizeCount[h.recommendedSize] ?? 0) + 1));
  const common = Object.entries(sizeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-lg font-semibold">Your Fit Profile</h2>
      <p className="mt-1 text-sm text-white/60">
        Built from your try-ons. The more you try, the smarter the DNA.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/50">Avg confidence</div>
          <div className="text-2xl font-bold text-accent-2">{avg}%</div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/50">Your common size</div>
          <div className="text-2xl font-bold">{common}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/50">Kept</div>
          <div className="text-2xl font-bold text-accent-2">{kept}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/50">Rejected</div>
          <div className="text-2xl font-bold text-red-400">{rejected}</div>
        </div>
      </div>
      {fit.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {fit.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
            >
              <span className="truncate">
                {h.garmentLabel}{" "}
                <span className="text-white/40">· {h.recommendedSize}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-accent-2">{h.confidence}%</span>
                <button
                  onClick={() => decide(h.id, "kept")}
                  className={`rounded px-2 py-0.5 text-xs ${
                    h.decided === "kept" ? "bg-accent-2 text-black" : "bg-white/10"
                  }`}
                >
                  Keep
                </button>
                <button
                  onClick={() => decide(h.id, "rejected")}
                  className={`rounded px-2 py-0.5 text-xs ${
                    h.decided === "rejected" ? "bg-red-500 text-white" : "bg-white/10"
                  }`}
                >
                  Reject
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {fit.length === 0 && (
        <p className="mt-4 text-sm text-white/40">No try-ons yet.</p>
      )}
    </div>
  );
}

export default function TryOnPage() {
  const [category, setCategory] = useState<Category>("cloth");
  const [brand, setBrand] = useState<string>("default");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>("");
  const [garmentPreview, setGarmentPreview] = useState<string>("");
  const [body, setBody] = useState<BodyState>({
    bust: "",
    waist: "",
    hips: "",
    shoulder: "",
    height: "",
    footLength: "",
  });
  const [gender, setGender] = useState<"male" | "female">("female");
  const [style, setStyle] = useState<string>("random");
  const SHOE_STYLES = [
    "random",
    "style_minimalist",
    "style_bohemian",
    "style_cottagecore",
    "style_french_elegance",
    "style_retro_fashion",
  ];
  const [unit, setUnit] = useState<Unit>("cm");

  const [phase, setPhase] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [renderUrl, setRenderUrl] = useState<string>("");
  const [verdict, setVerdict] = useState<FitVerdict | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem("fitdna.profile.v1");
      return raw ? (JSON.parse(raw).history ?? []) : [];
    } catch {
      return [];
    }
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persist = useCallback((next: HistoryItem[]) => {
    setHistory(next);
    try {
      const prev = JSON.parse(localStorage.getItem("fitdna.profile.v1") ?? "{}");
      localStorage.setItem(
        "fitdna.profile.v1",
        JSON.stringify({ ...prev, history: next }),
      );
    } catch {}
  }, []);

  const decide = useCallback(
    (id: string, decision: Decision) => {
      persist(history.map((h) => (h.id === id ? { ...h, decided: decision } : h)));
    },
    [history, persist],
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function onSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelfie(f);
    setSelfiePreview(URL.createObjectURL(f));
  }
  async function onGarment(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setGarment(f);
    setGarmentPreview(URL.createObjectURL(f));
  }

  async function computeVerdict(): Promise<FitVerdict> {
    const res = await fetch("/api/fitscore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        brand,
        footLength: toCm(body.footLength, unit),
        body: {
          bust: toCm(body.bust, unit),
          waist: toCm(body.waist, unit),
          hips: toCm(body.hips, unit),
          shoulder: toCm(body.shoulder, unit),
          height: body.height ? Number(body.height) : undefined,
          footLength: toCm(body.footLength, unit),
        },
      }),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? "Fit score failed");
    return res.json();
  }

  async function run() {
    setError("");
    if (!selfie || !garment) {
      setError("Upload a selfie and a garment image.");
      return;
    }
    setPhase("rendering");
    setStatusText("Uploading images & starting try-on…");
    try {
      const [selfieDataUrl, garmentDataUrl] = await Promise.all([
        readFileAsDataUrl(selfie),
        readFileAsDataUrl(garment),
      ]);

      const startRes = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          selfieDataUrl,
          garmentDataUrl,
          style,
          gender,
        }),
      });
      if (!startRes.ok) throw new Error((await startRes.json()).error ?? "Try-on failed");
      const { taskId } = await startRes.json();

      // Save a history entry immediately (with thumbnails) so it persists even
      // if the try-on later fails. We update confidence/result on success.
      const entryId = crypto.randomUUID();
      persist([
        {
          id: entryId,
          kind: "fit",
          category,
          brand,
          garmentLabel: garment.name,
          selfieThumb: selfiePreview,
          garmentThumb: garmentPreview,
          recommendedSize: "—",
          confidence: 0,
          decided: "undecided",
          createdAt: Date.now(),
        },
        ...history,
      ]);

      pollRef.current = setInterval(async () => {
        const s = await fetch(`/api/tryon/status?taskId=${taskId}&category=${category}`);
        const status = await s.json();
        if (status.error) {
          clearInterval(pollRef.current!);
          setPhase("error");
          setError(status.error);
          return;
        }
        if (status.taskStatus === "processing" || status.taskStatus === "pending" || status.taskStatus === "running") {
          setStatusText("Generating your try-on…");
          return;
        }
        if (status.taskStatus === "error") {
          clearInterval(pollRef.current!);
          setPhase("error");
          setError(status.error ?? "Try-on errored");
          return;
        }
        clearInterval(pollRef.current!);
        // Prefer YouCam's own (always-public) result URL; use ImgBB hosted URL
        // only as a fallback. This keeps the image working even if ImgBB is off.
        setRenderUrl(status.resultUrl ?? status.hostedUrl ?? "");
        setStatusText("Scoring the fit…");
        const v = await computeVerdict();
        setVerdict(v);
        setPhase("done");
        persist(
          history.map((h) =>
            h.id === entryId
              ? {
                  ...h,
                  recommendedSize: v.recommendedSize,
                  confidence: v.confidence,
                  resultUrl: status.hostedUrl ?? status.resultUrl,
                }
              : h,
          ),
        );
      }, 3000);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-accent">
          <IconShirt className="h-4 w-4" /> Apparel Virtual Try-On
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Try it on. <span className="gradient-text">Score the fit.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-white/60">
          YouCam renders the look, FitDNA scores how well it fits <em>you</em>.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <div className="flex gap-2">
              {(["cloth", "shoes"] as Category[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm capitalize ${
                    category === c ? "bg-accent text-white" : "bg-white/10"
                  }`}
                >
                  {c === "cloth" ? <IconShirt className="h-4 w-4" /> : <IconShoe className="h-4 w-4" />}
                  {c === "cloth" ? "Clothes" : "Shoes"}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <label className="group flex flex-col items-center rounded-xl border border-dashed border-white/20 p-4 text-center transition hover:border-accent/50">
                <input type="file" accept="image/*" onChange={onSelfie} className="hidden" />
                {selfiePreview ? (
                  <SmartImg src={selfiePreview} alt="selfie" className="mt-1 h-28 w-28 rounded-lg" />
                ) : (
                  <>
                    <IconUpload className="h-7 w-7 text-white/40 transition group-hover:text-accent" />
                    <span className="mt-1 text-sm text-white/70">Your selfie</span>
                  </>
                )}
              </label>
              <label className="group flex flex-col items-center rounded-xl border border-dashed border-white/20 p-4 text-center transition hover:border-accent/50">
                <input type="file" accept="image/*" onChange={onGarment} className="hidden" />
                {garmentPreview ? (
                  <SmartImg src={garmentPreview} alt="garment" className="mt-1 h-28 w-28 rounded-lg" />
                ) : (
                  <>
                    {category === "cloth" ? (
                      <IconShirt className="h-7 w-7 text-white/40 transition group-hover:text-accent" />
                    ) : (
                      <IconShoe className="h-7 w-7 text-white/40 transition group-hover:text-accent" />
                    )}
                    <span className="mt-1 text-sm text-white/70">Garment image</span>
                  </>
                )}
              </label>
            </div>

            <div className="mt-4">
              <div className="text-sm text-white/60">Brand size chart</div>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b} className="text-black">
                    {b === "default" ? "Generic" : b.charAt(0).toUpperCase() + b.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-white/60">Units</span>
              {(["cm", "in"] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    unit === u ? "bg-accent text-white" : "bg-white/10"
                  }`}
                >
                  {u === "cm" ? "cm" : "inches"}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Num label={`Bust (${unit})`} v={body.bust} set={(v) => setBody({ ...body, bust: v })} />
              <Num label={`Waist (${unit})`} v={body.waist} set={(v) => setBody({ ...body, waist: v })} />
              <Num label={`Hips (${unit})`} v={body.hips} set={(v) => setBody({ ...body, hips: v })} />
              <Num label={`Shoulder (${unit})`} v={body.shoulder} set={(v) => setBody({ ...body, shoulder: v })} />
              <Num label="Height (cm)" v={body.height} set={(v) => setBody({ ...body, height: v })} />
              <Num
                label={category === "shoes" ? `Foot length (${unit})` : `Foot (${unit})`}
                v={body.footLength}
                set={(v) => setBody({ ...body, footLength: v })}
              />
            </div>

            {category === "shoes" && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "male" | "female")}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                >
                  <option className="text-black">female</option>
                  <option className="text-black">male</option>
                </select>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                >
                  {SHOE_STYLES.map((s) => (
                    <option key={s} value={s} className="text-black">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={run}
              disabled={phase === "rendering"}
              className="mt-5 w-full rounded-xl bg-accent py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {phase === "rendering" ? "Working…" : "Try on & score my fit"}
            </button>
            <ErrorBox raw={error} onRetry={phase === "error" ? run : undefined} />
          </div>

          {(phase === "rendering" || phase === "done") && (
            <div className="glass rounded-2xl p-5">
              {phase === "rendering" && <Loader text={statusText} />}
              {phase === "done" && verdict && (
                <div className="animate-pop">
                  <div className="flex flex-wrap items-center gap-5">
                    {renderUrl && (
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent to-accent-2 opacity-30 blur" />
                        <SmartImg
                          src={renderUrl}
                          alt="Your virtual try-on"
                          className="relative h-64 w-64 rounded-xl"
                        />
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <ScoreRing value={verdict.confidence} label="Fit" />
                      <div className="mt-1 text-lg font-semibold">
                        Size: {verdict.recommendedSize}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {selfiePreview && (
                          <SmartImg
                            src={selfiePreview}
                            alt="your selfie"
                            className="h-16 w-16 rounded"
                          />
                        )}
                        {garmentPreview && (
                          <SmartImg
                            src={garmentPreview}
                            alt="garment"
                            className="h-16 w-16 rounded"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1 text-sm text-white/70">
                    {verdict.reasons.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    {verdict.perSize.map((s) => (
                      <div key={s.size} className="flex-1 text-center">
                        <div className="text-xs text-white/50">{s.size}</div>
                        <div className="h-1.5 rounded bg-white/10">
                          <div
                            className="h-full rounded bg-accent-2"
                            style={{ width: `${s.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <aside>
          <ProfileSummary history={history} decide={decide} />
        </aside>
      </div>
    </main>
  );
}

function Num({
  label,
  v,
  set,
}: {
  label: string;
  v: string;
  set: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/50">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={v}
        onChange={(e) => set(e.target.value)}
        className="mt-1 w-full rounded-lg bg-white/10 px-2 py-1.5 text-sm"
        placeholder="—"
      />
    </label>
  );
}
