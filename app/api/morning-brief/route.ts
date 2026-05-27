import { NextResponse } from "next/server";
import { generateMorningBrief } from "@/lib/agent/morningBrief";
import { saveDailyAIObservations } from "@/lib/agent/researchMemory";
import {
  getLatestMorningBrief,
  getMorningBriefByDate,
  getShanghaiDate,
  saveMorningBrief,
  savedMorningBriefToBrief,
} from "@/lib/agent/saveMorningBrief";
import { hasProtectedWriteAccess } from "@/lib/auth/writeAccess";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MorningBriefRequestBody = {
  symbols?: string[];
  positions?: PortfolioPosition[];
  refresh?: boolean;
};

const normalizeSymbols = (symbols: unknown): string[] =>
  Array.isArray(symbols)
    ? symbols
        .filter((symbol): symbol is string => typeof symbol === "string")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    : [];

const parseBody = async (request: Request): Promise<MorningBriefRequestBody> => {
  try {
    return (await request.json()) as MorningBriefRequestBody;
  } catch {
    return {};
  }
};

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? getShanghaiDate();
  const saved = (await getMorningBriefByDate(date)) ?? (await getLatestMorningBrief());

  return NextResponse.json({
    brief: saved ? savedMorningBriefToBrief(saved) : null,
    saved,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  if (!(await hasProtectedWriteAccess(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseBody(request);
    const brief = await generateMorningBrief({
      symbols: normalizeSymbols(body.symbols),
      positions: Array.isArray(body.positions) ? body.positions : [],
      forceRefresh: Boolean(body.refresh),
    });
    const saved = await saveMorningBrief(brief);
    await saveDailyAIObservations(brief);

    return NextResponse.json({
      brief,
      saved,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      brief: null,
      error: "Morning Brief 生成失败，已使用 fallback。",
      lastUpdated: new Date().toISOString(),
    });
  }
}
