import { NextResponse } from "next/server";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { getAlertsForSymbolsAndPortfolio } from "@/lib/services/alertService";

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
    const url = new URL(request.url);
    const raw = url.searchParams.get("positions");
    return raw ? (JSON.parse(raw) as PortfolioPosition[]) : [];
  } catch {
    return [];
  }
};

const shouldRefresh = (request: Request): boolean => {
  const url = new URL(request.url);
  return url.searchParams.get("refresh") === "1";
};

export async function GET(request: Request) {
  try {
    const alerts = await getAlertsForSymbolsAndPortfolio(
      parseSymbols(request),
      parsePositions(request),
      { forceRefresh: shouldRefresh(request) },
    );
    return NextResponse.json({ alerts, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({
      alerts: [],
      error: "预警刷新失败，已使用 fallback。",
      lastUpdated: new Date().toISOString(),
    });
  }
}
