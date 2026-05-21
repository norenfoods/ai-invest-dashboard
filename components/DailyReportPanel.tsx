"use client";

import { useEffect, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import type { Stock } from "@/lib/mockData";
import { getWatchlistSymbols } from "@/lib/watchlist/watchlistStore";

type AIDailyReport = {
  marketOverview: string;
  watchlistMoves: string[];
  majorRisks: string[];
  tomorrowFocus: string[];
  disclaimer: string;
};

type DailyReportPanelProps = {
  initialReport: AIDailyReport;
  initialStocks: Stock[];
};

async function fetchDailyReport(
  symbols: string[],
  refresh = false,
): Promise<{ report: AIDailyReport | null; stocks: Stock[] }> {
  try {
    const params = new URLSearchParams({ symbols: symbols.join(",") });
    if (refresh) {
      params.set("refresh", "1");
    }
    const response = await fetch(`/api/daily-report?${params.toString()}`);
    const data = (await response.json()) as {
      report: AIDailyReport | null;
      stocks: Stock[];
      lastUpdated?: string;
      error?: string;
    };
    window.dispatchEvent(
      new CustomEvent(data.error ? "app:data-error" : "app:data-updated", {
        detail: { lastUpdated: data.lastUpdated, message: data.error },
      }),
    );
    return data;
  } catch {
    window.dispatchEvent(new CustomEvent("app:data-error"));
    return { report: null, stocks: [] };
  }
}

export default function DailyReportPanel({
  initialReport,
  initialStocks,
}: DailyReportPanelProps) {
  const [report, setReport] = useState(initialReport);
  const [stocks, setStocks] = useState(initialStocks);

  useEffect(() => {
    const refresh = (forceRefresh = false) => {
      void fetchDailyReport(getWatchlistSymbols(), forceRefresh).then((data) => {
        if (data.report) {
          setReport(data.report);
        }
        if (data.stocks.length) {
          setStocks(data.stocks);
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
      window.removeEventListener("watchlist:changed", handleRegularRefresh);
      window.removeEventListener("app:refresh-data", handleAppRefresh);
      window.removeEventListener("storage", handleRegularRefresh);
    };
  }, []);

  const leaders = [...stocks]
    .sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity))
    .slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
      <DashboardCard title="日报正文" eyebrow="Market Narrative">
        <div className="space-y-6">
          <article>
            <h2 className="text-base font-semibold text-terminal-text">
              今日市场概览
            </h2>
            <p className="mt-2 text-sm leading-7 text-terminal-muted">
              {report.marketOverview}
            </p>
          </article>
          <article>
            <h2 className="text-base font-semibold text-terminal-text">
              自选股异动
            </h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-muted">
              {report.watchlistMoves.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2 className="text-base font-semibold text-terminal-text">
              主要风险
            </h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-muted">
              {report.majorRisks.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </article>
          <article>
            <h2 className="text-base font-semibold text-terminal-text">
              明日关注事项
            </h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-muted">
              {report.tomorrowFocus.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </article>
          <div className="text-xs text-terminal-muted">{report.disclaimer}</div>
        </div>
      </DashboardCard>

      <DashboardCard title="今日强势标的" eyebrow="Top Movers">
        <div className="space-y-3">
          {leaders.map((stock) => (
            <div
              key={stock.symbol}
              className="flex items-center justify-between rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-3"
            >
              <div>
                <div className="font-semibold text-terminal-text">
                  {stock.symbol} · {stock.companyName}
                </div>
                <div className="text-xs text-terminal-muted">{stock.sector}</div>
              </div>
              <div
                className={
                  (stock.changePercent ?? 0) >= 0
                    ? "text-terminal-green"
                    : "text-terminal-red"
                }
              >
                {stock.changePercent === null
                  ? "—"
                  : `${stock.changePercent > 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
