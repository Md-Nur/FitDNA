import "server-only";

// Optional public image host (ImgBB). Used when we want a publicly reachable
// URL for an image (e.g. sharing the rendered try-on, or passing a URL to an
// API that requires a public source). Not required for the core try-on flow,
// which uploads image bytes directly to YouCam's File API from the server.

const IMGBB_KEY = process.env.IMGBB_API_KEY;

export interface ImgBbUpload {
  url: string; // direct image URL
  deleteUrl?: string;
}

/**
 * Upload a raw image buffer to ImgBB and return a public URL.
 * Throws if IMGBB_API_KEY is not configured.
 */
export async function uploadToImgBb(
  image: Buffer,
  name = "fitdna.png",
): Promise<ImgBbUpload> {
  if (!IMGBB_KEY) {
    throw new Error("IMGBB_API_KEY is not set.");
  }

  const form = new FormData();
  form.append("image", image.toString("base64"));
  form.append("name", name);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImgBB upload failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    data?: { url?: string; delete_url?: string };
    success?: boolean;
  };
  if (!json.success || !json.data?.url) {
    throw new Error("ImgBB upload did not return a URL.");
  }

  return { url: json.data.url, deleteUrl: json.data.delete_url };
}
