"use client";

import { useEffect, useMemo, useState } from "react";
import type { Stock } from "@/lib/mockData";
import { getPositions } from "@/lib/portfolio/portfolioStore";
import type { PortfolioPosition } from "@/lib/portfolio/types";

type PortfolioSummaryCardProps = {
  initialStocks: Stock[];
};

const currency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

async function fetchStocks(symbols: string[], refresh = false): Promise<Stock[]> {
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

export default function PortfolioSummaryCard({
  initialStocks,
}: PortfolioSummaryCardProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);

  useEffect(() => {
    const refresh = (forceRefresh = false) => {
      const nextPositions = getPositions();
      setPositions(nextPositions);
      void fetchStocks(
        nextPositions.map((position) => position.symbol),
        forceRefresh,
      ).then(setStocks);
    };
    const handleAppRefresh = () => refresh(true);
    const handleRegularRefresh = () => refresh(false);

    refresh();
    window.addEventListener("app:refresh-data", handleAppRefresh);
    window.addEventListener("portfolio:changed", handleRegularRefresh);
    window.addEventListener("storage", handleRegularRefresh);

    return () => {
      window.removeEventListener("app:refresh-data", handleAppRefresh);
      window.removeEventListener("portfolio:changed", handleRegularRefresh);
      window.removeEventListener("storage", handleRegularRefresh);
    };
  }, []);

  const summary = useMemo(() => {
    const stockMap = new Map(stocks.map((stock) => [stock.symbol, stock]));
    const rows = positions.flatMap((position) => {
      const price = stockMap.get(position.symbol)?.price ?? null;

      if (price === null) {
        return [];
      }

      const marketValue = position.shares * price;
      const cost = position.shares * position.avgCost;

      return [{ marketValue, cost }];
    });
    const totalValue = rows.reduce((sum, row) => sum + row.marketValue, 0);
    const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
    const pnl = totalValue - totalCost;
    const returnRate = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    return { totalValue, pnl, returnRate };
  }, [positions, stocks]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-3">
        <div className="text-xs text-terminal-muted">总市值</div>
        <div className="mt-2 text-lg font-semibold text-terminal-text">
          {currency(summary.totalValue)}
        </div>
      </div>
      <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-3">
        <div className="text-xs text-terminal-muted">浮动盈亏</div>
        <div
          className={`mt-2 text-lg font-semibold ${
            summary.pnl >= 0 ? "text-terminal-green" : "text-terminal-red"
          }`}
        >
          {currency(summary.pnl)}
        </div>
      </div>
      <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-3">
        <div className="text-xs text-terminal-muted">收益率</div>
        <div
          className={`mt-2 text-lg font-semibold ${
            summary.returnRate >= 0 ? "text-terminal-green" : "text-terminal-red"
          }`}
        >
          {summary.returnRate.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
