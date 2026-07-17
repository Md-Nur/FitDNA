// Shared types for the light-B Wardrobe / Fit Profile layer.
// Profile is persisted in browser localStorage (no backend DB for the hackathon).

export interface BodyProfileInput {
  bust?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  height?: number;
  footLength?: number; // cm, for shoes
}

export interface TryOnHistoryItem {
  id: string;
  category: "cloth" | "shoes";
  brand: string;
  garmentLabel: string;
  recommendedSize: string;
  confidence: number;
  resultUrl?: string;
  decided: "kept" | "rejected" | "undecided";
  createdAt: number;
}

export interface FitProfile {
  body: BodyProfileInput;
  history: TryOnHistoryItem[];
}

const STORAGE_KEY = "fitdna.profile.v1";

export function loadProfile(): FitProfile {
  if (typeof window === "undefined") {
    return { body: {}, history: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { body: {}, history: [] };
    const parsed = JSON.parse(raw) as FitProfile;
    return { body: parsed.body ?? {}, history: parsed.history ?? [] };
  } catch {
    return { body: {}, history: [] };
  }
}

export function saveProfile(profile: FitProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function upsertBody(profile: FitProfile, body: BodyProfileInput): FitProfile {
  const next = { ...profile, body: { ...profile.body, ...body } };
  saveProfile(next);
  return next;
}

export function addHistory(
  profile: FitProfile,
  item: TryOnHistoryItem,
): FitProfile {
  const history = [item, ...profile.history].slice(0, 50);
  const next = { ...profile, history };
  saveProfile(next);
  return next;
}

export function setDecision(
  profile: FitProfile,
  id: string,
  decision: "kept" | "rejected" | "undecided",
): FitProfile {
  const history = profile.history.map((h) =>
    h.id === id ? { ...h, decided: decision } : h,
  );
  const next = { ...profile, history };
  saveProfile(next);
  return next;
}

/**
 * Aggregate the "Fit Profile" insight: which sizes/brands tend to fit this user.
 */
export function summarizeProfile(profile: FitProfile): {
  avgConfidence: number;
  kept: number;
  rejected: number;
  commonSize: string | null;
  brandHits: Record<string, number>;
} {
  const decided = profile.history.filter((h) => h.decided !== "undecided");
  const avgConfidence = decided.length
    ? Math.round(
        decided.reduce((s, h) => s + h.confidence, 0) / decided.length,
      )
    : 0;
  const kept = profile.history.filter((h) => h.decided === "kept").length;
  const rejected = profile.history.filter((h) => h.decided === "rejected").length;

  const sizeCount: Record<string, number> = {};
  for (const h of profile.history) {
    const s = h.recommendedSize;
    sizeCount[s] = (sizeCount[s] ?? 0) + 1;
  }
  const commonSize = Object.entries(sizeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const brandHits: Record<string, number> = {};
  for (const h of profile.history) {
    brandHits[h.brand] = (brandHits[h.brand] ?? 0) + 1;
  }

  return { avgConfidence, kept, rejected, commonSize, brandHits };
}
