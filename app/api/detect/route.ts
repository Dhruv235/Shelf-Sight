import { roboflowDetect } from "@/lib/roboflow";
import { buildQueryVariants, isMatch } from "@/lib/match";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const file = form.get("file");
    const query = String(form.get("query") ?? "").trim();

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const rf = await roboflowDetect(bytes);

    const variants = buildQueryVariants(query);

    const matches = (rf.predictions ?? []).filter(p =>
      isMatch(p.class, variants)
    );

    matches.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      query,
      variants,
      found: matches.length > 0,
      matchCount: matches.length,
      matches,
      allCount: rf.predictions?.length ?? 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
