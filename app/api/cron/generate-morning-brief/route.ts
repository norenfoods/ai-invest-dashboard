import { NextResponse } from "next/server";
import {
  generateAndSaveMorningBrief,
  getMorningBriefByDate,
  getShanghaiDate,
} from "@/lib/agent/saveMorningBrief";
import { hasProtectedWriteAccess } from "@/lib/auth/writeAccess";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { error: "Use POST to generate Morning Brief data." },
    { status: 405 },
  );
}

export async function POST(request: Request) {
  if (!(await hasProtectedWriteAccess(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getShanghaiDate();
  const existing = await getMorningBriefByDate(today);

  if (existing) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "today_already_generated",
      brief: existing,
      lastUpdated: new Date().toISOString(),
    });
  }

  const result = await generateAndSaveMorningBrief();

  return NextResponse.json({
    ok: true,
    skipped: false,
    saved: result.saved,
    alreadyGenerated: result.alreadyGenerated,
    lastUpdated: new Date().toISOString(),
  });
}
