import { NextRequest, NextResponse } from "next/server";
import {
  uploadImage,
  startTryOn,
  type GarmentCategory,
} from "@/lib/perfectcorp";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TryOnBody {
  category: GarmentCategory;
  // images as data URLs (base64). For dev simplicity we accept data URLs and
  // decode to buffers, then upload server-side so the API never needs a public URL.
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

    // Upload both images server-side.
    const [sourceFileId, referenceFileId] = await Promise.all([
      uploadImage(category, selfie.buffer, selfie.contentType),
      uploadImage(category, garment.buffer, garment.contentType),
    ]);

    const result = await startTryOn(category, {
      sourceFileId,
      referenceFileId,
      style: body.style,
      gender: body.gender,
    });

    return NextResponse.json({ taskId: result.taskId, category });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
