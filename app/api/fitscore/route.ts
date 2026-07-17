import { NextRequest, NextResponse } from "next/server";
import {
  scoreClothingFit,
  scoreShoeFit,
  SAMPLE_CLOTH_CHARTS,
  SAMPLE_SHOE_CHART,
  type BrandSizeChart,
  type BodyProfile,
} from "@/lib/fitscore";

export const runtime = "nodejs";

interface FitScoreBody {
  category: "cloth" | "shoes";
  brand?: string;
  body: BodyProfile;
  footLength?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FitScoreBody;
    if (body.category === "shoes") {
      const chart: BrandSizeChart = SAMPLE_SHOE_CHART;
      const footLength = body.footLength ?? body.body.footLength ?? 0;
      if (!footLength) {
        return NextResponse.json(
          { error: "footLength is required for shoe fit scoring" },
          { status: 400 },
        );
      }
      return NextResponse.json(scoreShoeFit(chart, footLength));
    }

    const brandKey = (body.brand && SAMPLE_CLOTH_CHARTS[body.brand]) || "default";
    const chart = SAMPLE_CLOTH_CHARTS[brandKey];
    return NextResponse.json(scoreClothingFit(chart, body.body));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
