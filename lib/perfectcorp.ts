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
 * Upload a raw image buffer to the YouCam File API for the given feature.
 * Returns the file_id used to reference the image in a task.
 */
export async function uploadImage(
  category: GarmentCategory,
  image: Buffer,
  contentType: string,
  fileName = "image.jpg",
): Promise<string> {
  const fileRes = await fetch(`${API_BASE}/s2s/v2.0/file/${category}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      files: [
        {
          content_type: contentType,
          file_name: fileName,
          file_size: image.byteLength,
        },
      ],
    }),
  });

  if (!fileRes.ok) {
    const text = await fileRes.text();
    throw new Error(
      `YouCam file API failed (${fileRes.status}): ${text.slice(0, 300)}`,
    );
  }

  const fileJson = (await fileRes.json()) as {
    files?: {
      file_id?: string;
      requests?: { url?: string; method?: string; headers?: Record<string, string> }[];
    }[];
  };
  const first = fileJson.files?.[0];
  const fileId = first?.file_id;
  const uploadUrl = first?.requests?.[0]?.url;
  if (!fileId || !uploadUrl) {
    throw new Error("YouCam file API did not return file_id/upload URL.");
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType, "Content-Length": String(image.byteLength) },
    body: new Uint8Array(image),
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    throw new Error(`YouCam upload failed (${putRes.status}): ${text.slice(0, 300)}`);
  }

  return fileId;
}

/**
 * Start an Apparel VTO task. For clothes we need a source (selfie) + reference
 * (garment). For shoes we additionally need style + gender.
 */
export async function startTryOn(
  category: GarmentCategory,
  opts: {
    sourceFileId: string;
    referenceFileId: string;
    style?: string;
    gender?: "male" | "female";
  },
): Promise<TryOnResult> {
  const payload: Record<string, unknown> = {
    source_file_id: opts.sourceFileId,
    reference_file_id: opts.referenceFileId,
  };
  if (category === "shoes") {
    payload.style = opts.style ?? "casual";
    payload.gender = opts.gender ?? "female";
  }

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
    throw new Error("YouCam task API did not return task_id.");
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
  };

  const status = (json.data?.task_status ?? "pending") as TryOnStatus["taskStatus"];
  return {
    taskStatus: status,
    resultUrl: json.data?.result?.url,
    error: json.data?.error,
  };
}
