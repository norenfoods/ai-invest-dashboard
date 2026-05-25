import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import {
  generateAndSaveMorningBrief,
  getMorningBriefByDate,
  getShanghaiDate,
} from "@/lib/agent/saveMorningBrief";

export const dynamic = "force-dynamic";

const isAuthorized = (request: Request): boolean => {
  const secret = getCronSecret();

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");

  return (
    authorization === `Bearer ${secret}` ||
    headerSecret === secret ||
    querySecret === secret
  );
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
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
