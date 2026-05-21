import { NextResponse } from "next/server";
import { getStocksBySymbols } from "@/lib/services/stockService";

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
    const stocks = await getStocksBySymbols(parseSymbols(request), {
      forceRefresh: shouldRefresh(request),
    });
    return NextResponse.json({ stocks, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({
      stocks: [],
      error: "数据刷新失败，已使用 fallback。",
      lastUpdated: new Date().toISOString(),
    });
  }
}
