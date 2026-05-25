import { NextResponse } from "next/server";
import { generateMorningBrief } from "@/lib/agent/morningBrief";
import { saveDailyAIObservations } from "@/lib/agent/researchMemory";
import { saveMorningBrief } from "@/lib/agent/saveMorningBrief";
import type { PortfolioPosition } from "@/lib/portfolio/types";

const parseSymbols = (request: Request): string[] => {
  const url = new URL(request.url);

  return (
    url.searchParams
      .get("symbols")
      ?.split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean) ?? []
  );
};

const parsePositions = (request: Request): PortfolioPosition[] => {
  try {
    const raw = new URL(request.url).searchParams.get("positions");
    return raw ? (JSON.parse(raw) as PortfolioPosition[]) : [];
  } catch {
    return [];
  }
};

const shouldRefresh = (request: Request): boolean =>
  new URL(request.url).searchParams.get("refresh") === "1";

export async function GET(request: Request) {
  try {
    const brief = await generateMorningBrief({
      symbols: parseSymbols(request),
      positions: parsePositions(request),
      forceRefresh: shouldRefresh(request),
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
