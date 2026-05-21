"use client";

import { useEffect, useState } from "react";
import type { StockAlert, AlertLevel } from "@/lib/rules/alertRules";
import { getPositions } from "@/lib/portfolio/portfolioStore";
import { getWatchlistSymbols } from "@/lib/watchlist/watchlistStore";

type AlertsListProps = {
  initialAlerts: StockAlert[];
  limit?: number;
};

const levelClass: Record<AlertLevel, string> = {
  high: "border-terminal-red/40 text-terminal-red",
  medium: "border-terminal-amber/40 text-terminal-amber",
  low: "border-terminal-cyan/40 text-terminal-cyan",
};

const levelLabel: Record<AlertLevel, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const typeLabel = {
  highValuation: "高估值",
  negativeGrowth: "负增长",
  lowMargin: "低利润率",
  earningsSoon: "财报临近",
  highDailyMove: "日内波动",
  singlePositionTooHigh: "持仓集中",
  portfolioLoss: "组合回撤",
  highRiskHolding: "高风险持仓",
};

async function fetchAlerts(
  symbols: string[],
  refresh = false,
): Promise<StockAlert[]> {
  try {
    const params = new URLSearchParams({
      symbols: symbols.join(","),
      positions: JSON.stringify(getPositions()),
    });
    if (refresh) {
      params.set("refresh", "1");
    }
    const response = await fetch(`/api/alerts?${params.toString()}`);
    const data = (await response.json()) as {
      alerts?: StockAlert[];
      lastUpdated?: string;
      error?: string;
    };
    window.dispatchEvent(
      new CustomEvent(data.error ? "app:data-error" : "app:data-updated", {
        detail: { lastUpdated: data.lastUpdated, message: data.error },
      }),
    );
    return data.alerts ?? [];
  } catch {
    window.dispatchEvent(new CustomEvent("app:data-error"));
    return [];
  }
}

export default function AlertsList({ initialAlerts, limit }: AlertsListProps) {
  const [alerts, setAlerts] = useState(initialAlerts);

  useEffect(() => {
    const refresh = (forceRefresh = false) => {
      void fetchAlerts(getWatchlistSymbols(), forceRefresh).then(setAlerts);
    };
    const handleAppRefresh = () => refresh(true);
    const handleRegularRefresh = () => refresh(false);

    refresh();
    window.addEventListener("app:refresh-data", handleAppRefresh);
    window.addEventListener("watchlist:changed", handleRegularRefresh);
    window.addEventListener("portfolio:changed", handleRegularRefresh);
    window.addEventListener("storage", handleRegularRefresh);

    return () => {
      window.removeEventListener("watchlist:changed", handleRegularRefresh);
      window.removeEventListener("app:refresh-data", handleAppRefresh);
      window.removeEventListener("portfolio:changed", handleRegularRefresh);
      window.removeEventListener("storage", handleRegularRefresh);
    };
  }, []);

  const visibleAlerts = typeof limit === "number" ? alerts.slice(0, limit) : alerts;

  if (!visibleAlerts.length) {
    return (
      <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4 text-sm text-terminal-muted">
        当前自选股未触发规则预警。
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visibleAlerts.map((alert) => (
        <article
          key={alert.id}
          className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-terminal-muted">
                {alert.symbol} · {alert.companyName}
              </div>
              <h2 className="mt-1 text-base font-semibold text-terminal-text">
                {typeLabel[alert.type]}
              </h2>
            </div>
            <span
              className={`rounded border px-2 py-1 text-xs ${levelClass[alert.level]}`}
            >
              {levelLabel[alert.level]}风险
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-terminal-muted">
            {alert.message}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-terminal-border pt-3 text-xs text-terminal-muted">
            <span>状态：待跟踪</span>
            <span>
              触发源：规则引擎 ·{" "}
              {new Date(alert.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
