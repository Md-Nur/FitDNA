import { NextRequest, NextResponse } from "next/server";
import { getTryOnStatus, type GarmentCategory } from "@/lib/perfectcorp";
import { uploadToImgBb } from "@/lib/imgbb";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  const category = req.nextUrl.searchParams.get("category") as GarmentCategory | null;
  if (!taskId || (category !== "cloth" && category !== "shoes")) {
    return NextResponse.json(
      { error: "taskId and valid category (cloth|shoes) are required" },
      { status: 400 },
    );
  }

  try {
    const status = await getTryOnStatus({
      taskId,
      category,
      statusUrl: "",
    });

    // On success, optionally re-host the result to ImgBB so the rendered image
    // has a stable public URL (handy for sharing / screenshots). If ImgBB isn't
    // configured or the fetch fails, we fall back to YouCam's own result URL.
    if (status.taskStatus === "success" && status.resultUrl) {
      try {
        const imgRes = await fetch(status.resultUrl);
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const hosted = await uploadToImgBb(buf, `${category}-${taskId}.png`);
          return NextResponse.json({ ...status, hostedUrl: hosted.url });
        }
      } catch {
        // ignore — fall through to returning YouCam's resultUrl
      }
    }

    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
