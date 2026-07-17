import { NextRequest, NextResponse } from "next/server";
import { startSkinAnalysis } from "@/lib/perfectcorp";
import { uploadToImgBb } from "@/lib/imgbb";

export const runtime = "nodejs";
export const maxDuration = 60;

interface SkinBody {
  selfieDataUrl: string;
  actions?: string[];
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
    const body = (await req.json()) as SkinBody;
    if (!body.selfieDataUrl) {
      return NextResponse.json({ error: "selfieDataUrl is required" }, { status: 400 });
    }
    const { buffer, contentType } = dataUrlToBuffer(body.selfieDataUrl);
    const hosted = await uploadToImgBb(buffer, "fitdna-skin.png");

    const result = await startSkinAnalysis(hosted.url, body.actions);
    return NextResponse.json({ taskId: result.taskId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
