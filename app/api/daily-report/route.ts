import { NextResponse } from "next/server";
import { generateDailyReport } from "@/lib/ai/dailyReport";
import { riskAlerts } from "@/lib/mockData";
import { getIndexQuotes, getStocksBySymbols } from "@/lib/services/stockService";

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

const shouldRefresh = (request: Request): boolean => {
  const url = new URL(request.url);
  return url.searchParams.get("refresh") === "1";
};

export async function GET(request: Request) {
  try {
    const forceRefresh = shouldRefresh(request);
    const [indexes, stocks] = await Promise.all([
      getIndexQuotes({ forceRefresh }),
      getStocksBySymbols(parseSymbols(request), { forceRefresh }),
    ]);
    const report = await generateDailyReport(
      indexes,
      stocks,
      riskAlerts,
      forceRefresh,
    );

    return NextResponse.json({
      report,
      stocks,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      report: null,
      stocks: [],
      error: "日报刷新失败，已使用 fallback。",
      lastUpdated: new Date().toISOString(),
    });
  }
}
