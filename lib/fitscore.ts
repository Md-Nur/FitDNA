// Fit Confidence scoring — the non-obvious layer on top of the YouCam render.
//
// Approach: a user provides their body measurements (or quick presets). We
// normalize a garment's brand-specific size chart into a common numeric scheme,
// then for each size compute how far the user's measurements sit from the
// brand's "ideal" per-keyword tolerance. The best-fitting size becomes the
// recommendation and the closeness becomes a 0-100 confidence score, with
// plain-language reasoning the user can act on.

export type MeasurementKey = "bust" | "waist" | "hips" | "shoulder" | "height";

export interface BodyProfile {
  bust?: number; // cm
  waist?: number;
  hips?: number;
  shoulder?: number;
  height?: number;
}

// Per-keyword tolerance: how much variance a garment of that type tolerates
// before fit degrades. Tighter garments (hips for jeans) have smaller slack.
const KEYWORD_TOLERANCE: Record<MeasurementKey, number> = {
  bust: 4,
  waist: 4,
  hips: 3,
  shoulder: 3,
  height: 0, // height not used for fit math, informational only
};

export interface SizeRow {
  size: string;
  bust?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
}

export interface BrandSizeChart {
  brand: string;
  category: "cloth" | "shoes";
  // shoes use EU size -> foot length cm mapping instead of body rows
  rows: SizeRow[];
  // for shoes: size label -> foot length (cm)
  footLengths?: Record<string, number>;
}

export interface FitVerdict {
  recommendedSize: string;
  confidence: number; // 0..100
  reasons: string[];
  perSize: { size: string; score: number }[];
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Score a single size row against the user's body profile.
 * Returns a 0..100 fit score plus reasons.
 */
function scoreSizeRow(
  row: SizeRow,
  profile: BodyProfile,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalGap = 0;
  let weighted = 0;
  let weightSum = 0;

  const keys: MeasurementKey[] = ["bust", "waist", "hips", "shoulder"];
  for (const key of keys) {
    const userVal = profile[key];
    const sizeVal = row[key];
    if (userVal == null || sizeVal == null) continue;
    const tol = KEYWORD_TOLERANCE[key];
    const gap = userVal - sizeVal; // + means user is larger than size spec
    const absGap = Math.abs(gap);
    // score contribution: 100 when exact, falls off with gap beyond tolerance
    const contribution = clamp(100 - Math.max(0, absGap - tol) * 18, 0, 100);
    // weight shoulders/bust slightly higher for tops, hips for bottoms
    const w = key === "hips" || key === "shoulder" ? 1.3 : 1;
    weighted += contribution * w;
    weightSum += w;
    totalGap += absGap;

    if (absGap > tol) {
      const dir = gap > 0 ? "run tight" : "run loose";
      reasons.push(
        `${labelFor(key)} ${dir} by ~${absGap.toFixed(0)}cm at size ${row.size}`,
      );
    }
  }

  const score = weightSum > 0 ? Math.round(weighted / weightSum) : 0;
  return { score, reasons };
}

function labelFor(key: MeasurementKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Compute the Fit Confidence verdict for a clothing size chart.
 */
export function scoreClothingFit(
  chart: BrandSizeChart,
  profile: BodyProfile,
): FitVerdict {
  const perSize = chart.rows.map((row) => {
    const { score } = scoreSizeRow(row, profile);
    return { size: row.size, score };
  });

  // pick best score; ties broken by closer-to-middle size
  let best = perSize[0];
  for (const s of perSize) if (s.score > best.score) best = s;

  const bestRow = chart.rows.find((r) => r.size === best.size)!;
  const { reasons } = scoreSizeRow(bestRow, profile);

  const confidence = best.score;
  const reasonsOut: string[] = [];
  if (confidence >= 85) {
    reasonsOut.push(
      `Size ${best.size} fits your measurements very well — low return risk.`,
    );
  } else if (confidence >= 65) {
    reasonsOut.push(
      `Size ${best.size} is a reasonable fit, with minor adjustments.`,
    );
  } else {
    reasonsOut.push(
      `Size ${best.size} is the closest available, but fit is uncertain — consider the brand's sizing-up guidance.`,
    );
  }
  reasonsOut.push(...reasons);

  // "between sizes" nudge
  const sorted = [...perSize].sort((a, b) => b.score - a.score);
  if (sorted.length > 1 && sorted[0].score - sorted[1].score <= 8) {
    reasonsOut.push(
      `You're between ${sorted[0].size} and ${sorted[1].size}; size up if you prefer a relaxed fit, down for snug.`,
    );
  }

  return {
    recommendedSize: best.size,
    confidence,
    reasons: reasonsOut,
    perSize,
  };
}

/**
 * Score shoes: map foot length (cm) to the closest EU size in the chart.
 */
export function scoreShoeFit(
  chart: BrandSizeChart,
  footLengthCm: number,
): FitVerdict {
  if (!chart.footLengths) {
    return {
      recommendedSize: "—",
      confidence: 0,
      reasons: ["No shoe size chart provided."],
      perSize: [],
    };
  }

  const entries = Object.entries(chart.footLengths).map(([size, len]) => ({
    size,
    len,
    gap: Math.abs(footLengthCm - len),
  }));

  const best = entries.reduce((a, b) => (a.gap < b.gap ? a : b));
  const confidence = clamp(Math.round(100 - best.gap * 12), 0, 100);

  // find second best to detect half-size territory
  const second = entries
    .filter((e) => e.size !== best.size)
    .reduce((a, b) => (a.gap < b.gap ? a : b));

  const reasons: string[] = [];
  if (confidence >= 85) {
    reasons.push(`EU ${best.size} matches your foot length closely.`);
  } else if (confidence >= 60) {
    reasons.push(`EU ${best.size} is the closest match; fit is approximate.`);
  } else {
    reasons.push(`EU ${best.size} is closest, but your foot is between sizes.`);
  }
  if (best.gap > 0.4 && second.gap < best.gap + 0.6) {
    reasons.push(
      `Between EU ${best.size} and ${second.size} — size up for thick socks/wide feet.`,
    );
  }

  const perSize = entries
    .map((e) => ({ size: e.size, score: clamp(Math.round(100 - e.gap * 12), 0, 100) }))
    .sort((a, b) => Number(a.size) - Number(b.size));

  return {
    recommendedSize: `EU ${best.size}`,
    confidence,
    reasons,
    perSize,
  };
}

// ----- Sample brand size charts (demo data; a real build would fetch per brand) -----

export const SAMPLE_CLOTH_CHARTS: Record<string, BrandSizeChart> = {
  default: {
    brand: "Generic",
    category: "cloth",
    rows: [
      { size: "XS", bust: 82, waist: 64, hips: 88, shoulder: 36 },
      { size: "S", bust: 86, waist: 68, hips: 92, shoulder: 38 },
      { size: "M", bust: 90, waist: 72, hips: 96, shoulder: 40 },
      { size: "L", bust: 96, waist: 78, hips: 102, shoulder: 42 },
      { size: "XL", bust: 102, waist: 84, hips: 108, shoulder: 44 },
    ],
  },
  zara: {
    brand: "Zara",
    category: "cloth",
    rows: [
      { size: "XS", bust: 80, waist: 60, hips: 86, shoulder: 35 },
      { size: "S", bust: 84, waist: 64, hips: 90, shoulder: 37 },
      { size: "M", bust: 90, waist: 70, hips: 96, shoulder: 39 },
      { size: "L", bust: 96, waist: 76, hips: 102, shoulder: 41 },
      { size: "XL", bust: 104, waist: 84, hips: 110, shoulder: 43 },
    ],
  },
};

export const SAMPLE_SHOE_CHART: BrandSizeChart = {
  brand: "Generic",
  category: "shoes",
  rows: [],
  footLengths: {
    "36": 23.0,
    "37": 23.7,
    "38": 24.3,
    "39": 25.0,
    "40": 25.6,
    "41": 26.3,
    "42": 27.0,
  },
};
