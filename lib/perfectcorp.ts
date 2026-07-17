import "server-only";

export type GarmentCategory = "cloth" | "shoes";

export interface TryOnResult {
  taskId: string;
  category: GarmentCategory;
  statusUrl: string;
}

export interface TryOnStatus {
  taskStatus: "pending" | "processing" | "success" | "error";
  resultUrl?: string;
  error?: string;
}

export interface SkinResult {
  taskId: string;
  statusUrl: string;
}

export interface SkinStatus {
  taskStatus: "pending" | "processing" | "success" | "error";
  // Raw score_info from the API when format=json
  analysis?: Record<string, unknown>;
  resultUrl?: string;
  error?: string;
}

const API_BASE =
  process.env.PERFECTCORP_API_BASE?.replace(/\/$/, "") ||
  "https://yce-api-01.perfectcorp.com";

function authHeaders() {
  const key = process.env.PERFECTCORP_API_KEY;
  if (!key) {
    throw new Error(
      "PERFECTCORP_API_KEY is not set. Copy .env.example to .env and add your YouCam API key.",
    );
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  } as const;
}

/**
 * Start an Apparel VTO task using publicly reachable image URLs for the source
 * (selfie) and reference (garment). The YouCam task API accepts this
 * (src_file_url + ref_file_url + garment_category) shape reliably. ImgBB
 * (lib/imgbb.ts) is used to host the images so they have public URLs.
 */
export async function startTryOn(
  category: GarmentCategory,
  opts: {
    sourceFileUrl: string;
    referenceFileUrl: string;
    style?: string;
    gender?: "male" | "female";
    garmentCategory?: "auto" | "full_body" | "lower_body" | "upper_body" | "shoes";
  },
): Promise<TryOnResult> {
  const inner: Record<string, unknown> = {
    src_file_url: opts.sourceFileUrl,
    ref_file_url: opts.referenceFileUrl,
    garment_category: opts.garmentCategory ?? "auto",
  };
  if (category === "shoes") {
    inner.style = opts.style ?? "casual";
    inner.gender = opts.gender ?? "female";
  }

  const payload = inner;

  const taskRes = await fetch(`${API_BASE}/s2s/v2.0/task/${category}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!taskRes.ok) {
    const text = await taskRes.text();
    throw new Error(
      `YouCam task API failed (${taskRes.status}): ${text.slice(0, 300)}`,
    );
  }

  const taskJson = (await taskRes.json()) as {
    data?: { task_id?: string };
    result?: { task_id?: string };
  };
  const taskId = taskJson.data?.task_id ?? taskJson.result?.task_id;
  if (!taskId) {
    throw new Error(
      `YouCam task API did not return task_id. Body: ${JSON.stringify(taskJson).slice(0, 400)}`,
    );
  }

  return {
    taskId,
    category,
    statusUrl: `${API_BASE}/s2s/v2.0/task/${category}/${taskId}`,
  };
}

/**
 * Poll a running task. Caller is responsible for retry/backoff.
 */
export async function getTryOnStatus(result: TryOnResult): Promise<TryOnStatus> {
  const statusRes = await fetch(result.statusUrl, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!statusRes.ok) {
    const text = await statusRes.text();
    throw new Error(
      `YouCam status API failed (${statusRes.status}): ${text.slice(0, 300)}`,
    );
  }

  const json = (await statusRes.json()) as {
    data?: {
      task_status?: string;
      result?: { url?: string };
      error?: string;
    };
    task_status?: string;
    result?: { url?: string };
    error?: string;
  };

  const data = json.data ?? json;
  const status = (data.task_status ?? "pending") as TryOnStatus["taskStatus"];
  return {
    taskStatus: status,
    resultUrl: data.result?.url,
    error: data.error,
  };
}

/**
 * Start a Skin Analysis task. YouCam requires `dst_actions` (the features to
 * analyze) and a publicly reachable selfie URL, wrapped in `body`. We request
 * `format: "json"` so the scores come back inline (no ZIP to unpack).
 */
export async function startSkinAnalysis(
  selfieUrl: string,
  actions: string[] = DEFAULT_SKIN_ACTIONS,
): Promise<SkinResult> {
  const payload = {
    dst_actions: actions,
    format: "json",
    body: { src_file_url: selfieUrl },
  };

  const taskRes = await fetch(`${API_BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!taskRes.ok) {
    const text = await taskRes.text();
    throw new Error(
      `YouCam skin task API failed (${taskRes.status}): ${text.slice(0, 300)}`,
    );
  }

  const taskJson = (await taskRes.json()) as {
    data?: { task_id?: string };
    result?: { task_id?: string };
  };
  const taskId = taskJson.data?.task_id ?? taskJson.result?.task_id;
  if (!taskId) {
    throw new Error(
      `YouCam skin task API did not return task_id. Body: ${JSON.stringify(taskJson).slice(0, 400)}`,
    );
  }

  return {
    taskId,
    statusUrl: `${API_BASE}/s2s/v2.0/task/skin-analysis/${taskId}`,
  };
}

/**
 * Poll a Skin Analysis task. Returns the raw `score_info` when format=json.
 */
export async function getSkinStatus(result: SkinResult): Promise<SkinStatus> {
  const statusRes = await fetch(result.statusUrl, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!statusRes.ok) {
    const text = await statusRes.text();
    throw new Error(
      `YouCam skin status API failed (${statusRes.status}): ${text.slice(0, 300)}`,
    );
  }

  const json = (await statusRes.json()) as {
    data?: {
      task_status?: string;
      result?: { url?: string };
      score_info?: Record<string, unknown>;
      error?: string;
    };
    task_status?: string;
    result?: { url?: string };
    score_info?: Record<string, unknown>;
    error?: string;
  };

  const data = json.data ?? json;
  const status = (data.task_status ?? "pending") as SkinStatus["taskStatus"];
  return {
    taskStatus: status,
    analysis: data.score_info,
    resultUrl: data.result?.url,
    error: data.error,
  };
}

// SD features — a solid, broadly useful set without mixing HD/SD.
export const DEFAULT_SKIN_ACTIONS = [
  "wrinkle",
  "pore",
  "texture",
  "acne",
  "oiliness",
  "radiance",
  "dark_circle_v2",
  "eye_bag",
  "age_spot",
  "redness",
  "moisture",
  "skin_type",
];
