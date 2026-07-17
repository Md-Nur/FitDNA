import { NextRequest, NextResponse } from "next/server";
import { getTryOnStatus, type GarmentCategory } from "@/lib/perfectcorp";

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
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
