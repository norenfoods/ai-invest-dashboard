"use client";

import { useEffect, useMemo, useState } from "react";
import MetricCard from "@/components/MetricCard";
import type { Stock } from "@/lib/mockData";
import {
  addOrUpdatePositionSynced,
  getPositionsSynced,
  removePositionSynced,
  resetPositionsSynced,
} from "@/lib/portfolio/portfolioStore";
import type { PortfolioPosition } from "@/lib/portfolio/types";

type PortfolioManagerProps = {
  initialStocks: Stock[];
};

type PortfolioRow = {
  position: PortfolioPosition;
  stock: Stock | undefined;
  currentPrice: number | null;
  marketValue: number | null;
  cost: number;
  pnl: number | null;
  pnlPercent: number | null;
  weight: number | null;
};

const currency = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const percent = (value: number): string => `${value.toFixed(2)}%`;

const calculable = "无法计算";

const formatNullableCurrency = (value: number | null): string =>
  value === null ? calculable : currency(value);

const formatNullablePercent = (value: number | null): string =>
  value === null ? calculable : percent(value);

const dataSourceLabel = {
  fmp: "FMP 实时",
  yahoo: "Yahoo 备用",
  mock: "Mock 模拟",
  none: "数据缺失",
};

const getDataSourceLabel = (stock: Stock | undefined): string => {
  if (!stock) {
    return dataSourceLabel.none;
  }

  if (stock.dataSource) {
    return dataSourceLabel[stock.dataSource];
  }

  if (stock.dataStatus === "live") {
    return dataSourceLabel.fmp;
  }

  if (stock.dataStatus === "fallback") {
    return dataSourceLabel.mock;
  }

  return dataSourceLabel.none;
};

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
  const [syncLabel, setSyncLabel] = useState("登录后自动云同步，未登录使用本地 fallback");

  const refresh = (nextPositions: PortfolioPosition[], forceRefresh = false) => {
    setPositions(nextPositions);
    const symbols = nextPositions.map((position) => position.symbol);
    void fetchStocks(symbols, forceRefresh).then(setStocks);
  };

  useEffect(() => {
    const refreshFromStore = (forceRefresh = false) => {
      void getPositionsSynced().then((nextPositions) => {
        refresh(nextPositions, forceRefresh);
        setSyncLabel("登录后自动云同步，未登录使用本地 fallback");
      });
    };
    const handlePortfolioRefresh = () => refreshFromStore(false);
    const handleAppRefresh = () => refreshFromStore(true);

    refreshFromStore();
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
      const currentPrice = stock?.price ?? null;
      const marketValue =
        currentPrice === null ? null : position.shares * currentPrice;
      const cost = position.shares * position.avgCost;
      const pnl = marketValue === null ? null : marketValue - cost;
      const pnlPercent = pnl === null || cost <= 0 ? null : (pnl / cost) * 100;

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
      (sum, row) => sum + (row.marketValue ?? 0),
      0,
    );

    return baseRows.map((row) => ({
      ...row,
      weight:
        totalMarketValue > 0 && row.marketValue !== null
          ? (row.marketValue / totalMarketValue) * 100
          : null,
    }));
  }, [positions, stockMap]);

  const summary = useMemo(() => {
    const pricedRows = rows.filter((row) => row.marketValue !== null);
    const totalMarketValue = pricedRows.reduce(
      (sum, row) => sum + (row.marketValue ?? 0),
      0,
    );
    const totalCost = pricedRows.reduce((sum, row) => sum + row.cost, 0);
    const totalPnl = totalMarketValue - totalCost;
    const totalReturn = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const maxWeight = pricedRows.reduce(
      (max, row) => Math.max(max, row.weight ?? 0),
      0,
    );

    return { totalMarketValue, totalCost, totalPnl, totalReturn, maxWeight };
  }, [rows]);

  const handleSubmit = async () => {
    const nextPositions = await addOrUpdatePositionSynced({
      symbol: form.symbol,
      shares: Number(form.shares),
      avgCost: Number(form.avgCost),
      note: form.note,
    });

    setForm({ symbol: "", shares: "", avgCost: "", note: "" });
    refresh(nextPositions);
  };

  const handleRemove = async (symbol: string) => {
    refresh(await removePositionSynced(symbol));
  };

  const handleReset = async () => {
    refresh(await resetPositionsSynced());
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

      <div className="text-xs text-terminal-muted">{syncLabel}</div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="border-b border-terminal-border text-sm text-terminal-muted">
              <th className="pb-3 font-medium">股票代码</th>
              <th className="pb-3 text-right font-medium">持仓股数</th>
              <th className="pb-3 text-right font-medium">成本价</th>
              <th className="pb-3 text-right font-medium">当前价</th>
              <th className="pb-3 text-right font-medium">数据来源</th>
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
                  {row.currentPrice === null ? "暂无实时价格" : currency(row.currentPrice)}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {getDataSourceLabel(row.stock)}
                </td>
                <td className="py-4 text-right text-terminal-text">
                  {formatNullableCurrency(row.marketValue)}
                </td>
                <td
                  className={`py-4 text-right font-medium ${
                    row.pnl === null
                      ? "text-terminal-muted"
                      : row.pnl >= 0
                        ? "text-terminal-green"
                        : "text-terminal-red"
                  }`}
                >
                  {formatNullableCurrency(row.pnl)}
                </td>
                <td
                  className={`py-4 text-right font-medium ${
                    row.pnlPercent === null
                      ? "text-terminal-muted"
                      : row.pnlPercent >= 0
                        ? "text-terminal-green"
                        : "text-terminal-red"
                  }`}
                >
                  {formatNullablePercent(row.pnlPercent)}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {formatNullablePercent(row.weight)}
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
