"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Stock } from "@/lib/mockData";
import { getWatchlistSymbols } from "@/lib/watchlist/watchlistStore";

type DashboardWatchlistRankingProps = {
  initialStocks: Stock[];
};

const formatPrice = (value: number | null): string =>
  value === null ? "暂无实时价格" : `$${value.toFixed(2)}`;

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

async function fetchWatchlist(symbols: string[], refresh = false): Promise<Stock[]> {
  try {
    const params = new URLSearchParams({ symbols: symbols.join(",") });
    if (refresh) {
      params.set("refresh", "1");
    }
    const response = await fetch(`/api/watchlist?${params.toString()}`);
    const data = (await response.json()) as {
      stocks?: Stock[];
      lastUpdated?: string;
      error?: string;
    };
    window.dispatchEvent(
      new CustomEvent(data.error ? "app:data-error" : "app:data-updated", {
        detail: { lastUpdated: data.lastUpdated, message: data.error },
      }),
    );
    return data.stocks ?? [];
  } catch {
    window.dispatchEvent(new CustomEvent("app:data-error"));
    return [];
  }
}

export default function DashboardWatchlistRanking({
  initialStocks,
}: DashboardWatchlistRankingProps) {
  const [stocks, setStocks] = useState(initialStocks);

  useEffect(() => {
    const refresh = (forceRefresh = false) => {
      void fetchWatchlist(getWatchlistSymbols(), forceRefresh).then((nextStocks) => {
        if (nextStocks.length) {
          setStocks(nextStocks);
        }
      });
    };
    const handleAppRefresh = () => refresh(true);
    const handleRegularRefresh = () => refresh(false);

    refresh();
    window.addEventListener("app:refresh-data", handleAppRefresh);
    window.addEventListener("watchlist:changed", handleRegularRefresh);
    window.addEventListener("storage", handleRegularRefresh);

    return () => {
      window.removeEventListener("app:refresh-data", handleAppRefresh);
      window.removeEventListener("watchlist:changed", handleRegularRefresh);
      window.removeEventListener("storage", handleRegularRefresh);
    };
  }, []);

  const rankedStocks = [...stocks].sort(
    (a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity),
  );

  return (
    <div className="space-y-3">
      {rankedStocks.map((stock, index) => (
        <Link
          key={stock.symbol}
          href={`/stocks/${stock.symbol}`}
          className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md border border-terminal-border bg-terminal-panelSoft/55 px-4 py-3 hover:border-terminal-cyan/45"
        >
          <span className="text-sm text-terminal-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="font-semibold text-terminal-text">
              {stock.symbol} · {stock.companyName}
            </div>
            <div className="text-xs text-terminal-muted">
              {stock.sector} · 风险{stock.riskLevel}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-terminal-text">
              {formatPrice(stock.price)}
            </div>
            <div
              className={
                (stock.changePercent ?? 0) >= 0
                  ? "text-sm text-terminal-green"
                  : "text-sm text-terminal-red"
              }
            >
              {formatPercent(stock.changePercent)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
