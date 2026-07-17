// Skin insight layer — translates YouCam's raw skin-analysis score_info into a
// readable "Skin Confidence" summary with per-concern ratings + advice. This is
// the non-obvious logic on top of the API, mirroring the Fit Confidence idea.

export interface SkinConcern {
  key: string;
  label: string;
  score: number; // 0..100 (higher = better for that concern)
  level: "good" | "fair" | "needs care";
  advice: string;
}

export interface SkinInsight {
  overall: number; // 0..100 skin confidence
  skinType?: string;
  concerns: SkinConcern[];
}

// Map raw YouCam feature keys to friendly labels + which direction is "good".
const CONCERN_META: Record<string, { label: string; goodWhenHigh: boolean; advice: string }> = {
  wrinkle: { label: "Wrinkles", goodWhenHigh: false, advice: "Use retinol + SPF; keep skin moisturized." },
  pore: { label: "Pores", goodWhenHigh: false, advice: "Clay masks + salicylic acid help minimize pores." },
  texture: { label: "Texture", goodWhenHigh: true, advice: "Gentle exfoliation smooths skin texture." },
  acne: { label: "Acne / Blemishes", goodWhenHigh: false, advice: "Spot treat with salicylic or benzoyl peroxide." },
  oiliness: { label: "Oiliness", goodWhenHigh: false, advice: "Oil-control cleanser; lightweight, non-comedogenic moisturizer." },
  radiance: { label: "Radiance", goodWhenHigh: true, advice: "Vitamin C + hydration boost glow." },
  dark_circle_v2: { label: "Dark Circles", goodWhenHigh: false, advice: "Sleep, caffeine-eye creams, and SPF help." },
  eye_bag: { label: "Eye Bags", goodWhenHigh: false, advice: "Cool compresses + reduced sodium can reduce puffiness." },
  age_spot: { label: "Age Spots", goodWhenHigh: false, advice: "Vitamin C / niacinamide + daily sunscreen." },
  redness: { label: "Redness", goodWhenHigh: false, advice: "Soothing centella / azelaic acid calms redness." },
  moisture: { label: "Moisture", goodWhenHigh: true, advice: "Humectants (hyaluronic acid) lock in water." },
  firmness: { label: "Firmness", goodWhenHigh: true, advice: "Peptides + sunscreen support elasticity." },
  skin_type: { label: "Skin Type", goodWhenHigh: true, advice: "Tailor your routine to your skin type." },
};

// Extract a 0..100 numeric score from whatever shape YouCam returns for a concern.
function extractScore(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return clamp(raw, 0, 100);
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["score", "value", "level_score", "rating"]) {
      if (typeof o[k] === "number") return clamp(o[k] as number, 0, 100);
    }
    // some features return a string level like "low"/"high"/"none"
    if (typeof o.level === "string") return levelToScore(o.level);
    if (typeof o.value === "string") return levelToScore(o.value);
  }
  return null;
}

function levelToScore(level: string): number {
  const l = level.toLowerCase();
  if (["none", "low", "very low"].includes(l)) return 90;
  if (["fair", "medium", "moderate"].includes(l)) return 60;
  if (["high", "severe", "very high"].includes(l)) return 25;
  return 50;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function levelOf(score: number): SkinConcern["level"] {
  if (score >= 75) return "good";
  if (score >= 50) return "fair";
  return "needs care";
}

/**
 * Turn YouCam's raw score_info into a SkinInsight. The raw object is expected
 * to be keyed by feature name, each value being a score/level object.
 */
export function interpretSkin(raw: Record<string, unknown> | undefined): SkinInsight {
  const concerns: SkinConcern[] = [];
  let skinType: string | undefined;

  if (raw) {
    for (const [key, val] of Object.entries(raw)) {
      // skin_type often returns a category string rather than a score
      if (key === "skin_type") {
        if (typeof val === "string") skinType = val;
        else if (val && typeof val === "object") {
          const o = val as Record<string, unknown>;
          skinType =
            (o.whole as string) ??
            (o.value as string) ??
            (o.type as string) ??
            undefined;
        }
        continue;
      }
      const meta = CONCERN_META[key];
      if (!meta) continue;
      const rawScore = extractScore(val);
      if (rawScore == null) continue;
      // Normalize so "higher = better" for every concern in our UI.
      const score = meta.goodWhenHigh ? rawScore : 100 - rawScore;
      concerns.push({
        key,
        label: meta.label,
        score: Math.round(score),
        level: levelOf(score),
        advice: meta.advice,
      });
    }
  }

  concerns.sort((a, b) => a.score - b.score); // worst first
  const overall = concerns.length
    ? Math.round(concerns.reduce((s, c) => s + c.score, 0) / concerns.length)
    : 0;

  return { overall, skinType, concerns };
}
