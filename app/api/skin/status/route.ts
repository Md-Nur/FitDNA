import { NextRequest, NextResponse } from "next/server";
import { getSkinStatus } from "@/lib/perfectcorp";
import { interpretSkin } from "@/lib/skinscore";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const status = await getSkinStatus({ taskId, statusUrl: "" });
    if (status.taskStatus === "success" && status.analysis) {
      return NextResponse.json({
        taskStatus: "success",
        insight: interpretSkin(status.analysis as Record<string, unknown>),
      });
    }
    return NextResponse.json({
      taskStatus: status.taskStatus,
      error: status.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
