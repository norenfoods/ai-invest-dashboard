"use client";

import { useEffect, useMemo, useState } from "react";
import MetricCard from "@/components/MetricCard";
import type { Stock } from "@/lib/mockData";
import {
  addOrUpdatePosition,
  getPositions,
  removePosition,
  resetPositions,
} from "@/lib/portfolio/portfolioStore";
import type { PortfolioPosition } from "@/lib/portfolio/types";

type PortfolioManagerProps = {
  initialStocks: Stock[];
};

type PortfolioRow = {
  position: PortfolioPosition;
  stock: Stock | undefined;
  currentPrice: number;
  marketValue: number;
  cost: number;
  pnl: number;
  pnlPercent: number;
  weight: number;
};

const currency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const percent = (value: number): string => `${value.toFixed(2)}%`;

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

export default function PortfolioManager({ initialStocks }: PortfolioManagerProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [form, setForm] = useState({
    symbol: "",
    shares: "",
    avgCost: "",
    note: "",
  });

  const refresh = (nextPositions = getPositions(), forceRefresh = false) => {
    setPositions(nextPositions);
    const symbols = nextPositions.map((position) => position.symbol);
    void fetchStocks(symbols, forceRefresh).then(setStocks);
  };

  useEffect(() => {
    const handlePortfolioRefresh = () => refresh(getPositions(), false);
    const handleAppRefresh = () => refresh(getPositions(), true);

    refresh();
    window.addEventListener("app:refresh-data", handleAppRefresh);
    window.addEventListener("portfolio:changed", handlePortfolioRefresh);
    window.addEventListener("storage", handlePortfolioRefresh);

    return () => {
      window.removeEventListener("app:refresh-data", handleAppRefresh);
      window.removeEventListener("portfolio:changed", handlePortfolioRefresh);
      window.removeEventListener("storage", handlePortfolioRefresh);
    };
  }, []);

  const stockMap = useMemo(
    () => new Map(stocks.map((stock) => [stock.symbol, stock])),
    [stocks],
  );

  const rows = useMemo<PortfolioRow[]>(() => {
    const baseRows = positions.map((position) => {
      const stock = stockMap.get(position.symbol);
      const currentPrice = stock?.price ?? 0;
      const marketValue = position.shares * currentPrice;
      const cost = position.shares * position.avgCost;
      const pnl = marketValue - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      return {
        position,
        stock,
        currentPrice,
        marketValue,
        cost,
        pnl,
        pnlPercent,
        weight: 0,
      };
    });

    const totalMarketValue = baseRows.reduce(
      (sum, row) => sum + row.marketValue,
      0,
    );

    return baseRows.map((row) => ({
      ...row,
      weight: totalMarketValue > 0 ? (row.marketValue / totalMarketValue) * 100 : 0,
    }));
  }, [positions, stockMap]);

  const summary = useMemo(() => {
    const totalMarketValue = rows.reduce((sum, row) => sum + row.marketValue, 0);
    const totalCost = rows.reduce((sum, row) => sum + row.cost, 0);
    const totalPnl = totalMarketValue - totalCost;
    const totalReturn = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const maxWeight = rows.reduce((max, row) => Math.max(max, row.weight), 0);

    return { totalMarketValue, totalCost, totalPnl, totalReturn, maxWeight };
  }, [rows]);

  const handleSubmit = () => {
    const nextPositions = addOrUpdatePosition({
      symbol: form.symbol,
      shares: Number(form.shares),
      avgCost: Number(form.avgCost),
      note: form.note,
    });

    setForm({ symbol: "", shares: "", avgCost: "", note: "" });
    refresh(nextPositions);
  };

  const handleRemove = (symbol: string) => {
    refresh(removePosition(symbol));
  };

  const handleReset = () => {
    refresh(resetPositions());
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="总持仓市值" value={currency(summary.totalMarketValue)} />
        <MetricCard label="总成本" value={currency(summary.totalCost)} />
        <MetricCard
          label="总浮动盈亏"
          value={currency(summary.totalPnl)}
          tone={summary.totalPnl >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="总收益率"
          value={percent(summary.totalReturn)}
          tone={summary.totalReturn >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="最大单一股票仓位"
          value={percent(summary.maxWeight)}
          tone={summary.maxWeight > 30 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-3 rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4 md:grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto]">
        <input
          value={form.symbol}
          onChange={(event) => setForm({ ...form, symbol: event.target.value })}
          placeholder="股票代码"
          className="min-h-11 rounded-md border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
        />
        <input
          value={form.shares}
          onChange={(event) => setForm({ ...form, shares: event.target.value })}
          placeholder="持仓股数"
          inputMode="decimal"
          className="min-h-11 rounded-md border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
        />
        <input
          value={form.avgCost}
          onChange={(event) => setForm({ ...form, avgCost: event.target.value })}
          placeholder="成本价"
          inputMode="decimal"
          className="min-h-11 rounded-md border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
        />
        <input
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          placeholder="备注"
          className="min-h-11 rounded-md border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md border border-terminal-cyan/40 bg-terminal-panel px-4 py-2 text-sm font-medium text-terminal-cyan hover:border-terminal-cyan"
        >
          保存
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-terminal-border bg-terminal-panel px-4 py-2 text-sm text-terminal-muted hover:text-terminal-text"
        >
          清空
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-terminal-border text-sm text-terminal-muted">
              <th className="pb-3 font-medium">股票代码</th>
              <th className="pb-3 text-right font-medium">持仓股数</th>
              <th className="pb-3 text-right font-medium">成本价</th>
              <th className="pb-3 text-right font-medium">当前价</th>
              <th className="pb-3 text-right font-medium">市值</th>
              <th className="pb-3 text-right font-medium">浮动盈亏</th>
              <th className="pb-3 text-right font-medium">盈亏百分比</th>
              <th className="pb-3 text-right font-medium">仓位占比</th>
              <th className="pb-3 text-right font-medium">风险等级</th>
              <th className="pb-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.position.symbol}
                className="border-b border-terminal-border/70 text-sm last:border-0"
              >
                <td className="py-4">
                  <div className="font-semibold text-terminal-text">
                    {row.position.symbol}
                  </div>
                  <div className="mt-1 text-xs text-terminal-muted">
                    {row.position.note || row.stock?.companyName || "无备注"}
                  </div>
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {row.position.shares}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {currency(row.position.avgCost)}
                </td>
                <td className="py-4 text-right text-terminal-text">
                  {currency(row.currentPrice)}
                </td>
                <td className="py-4 text-right text-terminal-text">
                  {currency(row.marketValue)}
                </td>
                <td
                  className={`py-4 text-right font-medium ${
                    row.pnl >= 0 ? "text-terminal-green" : "text-terminal-red"
                  }`}
                >
                  {currency(row.pnl)}
                </td>
                <td
                  className={`py-4 text-right font-medium ${
                    row.pnlPercent >= 0
                      ? "text-terminal-green"
                      : "text-terminal-red"
                  }`}
                >
                  {percent(row.pnlPercent)}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {percent(row.weight)}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {row.stock?.riskLevel ?? "中"}
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemove(row.position.symbol)}
                    className="rounded border border-terminal-red/35 px-3 py-1 text-xs text-terminal-red hover:border-terminal-red"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4 text-sm text-terminal-muted">
            暂无持仓。添加持仓后将显示组合市值、浮动盈亏和风险暴露。
          </div>
        ) : null}
      </div>
    </div>
  );
}
