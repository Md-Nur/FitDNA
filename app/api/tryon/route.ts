import { NextRequest, NextResponse } from "next/server";
import { startTryOn, type GarmentCategory } from "@/lib/perfectcorp";
import { uploadToImgBb } from "@/lib/imgbb";

export const runtime = "nodejs";
export const maxDuration = 300;

interface TryOnBody {
  category: GarmentCategory;
  // images as data URLs (base64). Decoded to buffers, hosted on ImgBB for a
  // public URL (YouCam's task API needs a publicly reachable source/reference).
  selfieDataUrl: string;
  garmentDataUrl: string;
  style?: string;
  gender?: "male" | "female";
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL");
  return {
    buffer: Buffer.from(match[2], "base64"),
    contentType: match[1],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TryOnBody;
    if (!body.selfieDataUrl || !body.garmentDataUrl) {
      return NextResponse.json(
        { error: "selfieDataUrl and garmentDataUrl are required" },
        { status: 400 },
      );
    }
    const category = body.category === "shoes" ? "shoes" : "cloth";

    const selfie = dataUrlToBuffer(body.selfieDataUrl);
    const garment = dataUrlToBuffer(body.garmentDataUrl);

    // Host both images on ImgBB so YouCam can fetch them via public URL.
    const [selfieHosted, garmentHosted] = await Promise.all([
      uploadToImgBb(selfie.buffer, "fitdna-selfie.png"),
      uploadToImgBb(garment.buffer, "fitdna-garment.png"),
    ]);

    const result = await startTryOn(category, {
      sourceFileUrl: selfieHosted.url,
      referenceFileUrl: garmentHosted.url,
      style: body.style,
      gender: body.gender,
      garmentCategory: "auto",
    });

    return NextResponse.json({
      taskId: result.taskId,
      category,
      selfieUrl: selfieHosted.url,
      garmentUrl: garmentHosted.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
