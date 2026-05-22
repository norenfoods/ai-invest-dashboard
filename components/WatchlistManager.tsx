"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Stock } from "@/lib/mockData";
import {
  addWatchlistSymbolSynced,
  getWatchlistSymbolsSynced,
  removeWatchlistSymbolSynced,
  resetWatchlistSynced,
} from "@/lib/watchlist/watchlistStore";

type WatchlistManagerProps = {
  initialStocks: Stock[];
};

const dataSourceLabel = {
  fmp: "FMP 实时",
  yahoo: "Yahoo 备用",
  mock: "Mock 模拟",
  none: "数据缺失",
};

const getDataSourceLabel = (stock: Stock): string => {
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

export default function WatchlistManager({ initialStocks }: WatchlistManagerProps) {
  const [symbols, setSymbols] = useState<string[]>(() =>
    initialStocks.map((stock) => stock.symbol),
  );
  const [stocks, setStocks] = useState<Stock[]>(initialStocks);
  const [input, setInput] = useState("");
  const [syncLabel, setSyncLabel] = useState("本地 fallback 可用");

  useEffect(() => {
    void getWatchlistSymbolsSynced().then((storedSymbols) => {
      setSymbols(storedSymbols);
      setSyncLabel("登录后自动云同步，未登录使用本地 fallback");
      void fetchWatchlist(storedSymbols).then((nextStocks) => {
        if (nextStocks.length) {
          setStocks(nextStocks);
        }
      });
    });
  }, []);

  const refresh = (nextSymbols: string[], forceRefresh = false) => {
    setSymbols(nextSymbols);
    void fetchWatchlist(nextSymbols, forceRefresh).then(setStocks);
  };

  useEffect(() => {
    const handleRefresh = () => {
      void getWatchlistSymbolsSynced().then((nextSymbols) =>
        refresh(nextSymbols, true),
      );
    };
    window.addEventListener("app:refresh-data", handleRefresh);

    return () => window.removeEventListener("app:refresh-data", handleRefresh);
  }, []);

  const handleAdd = async () => {
    const nextSymbols = await addWatchlistSymbolSynced(input);
    setInput("");
    refresh(nextSymbols);
  };

  const handleRemove = async (symbol: string) => {
    refresh(await removeWatchlistSymbolSynced(symbol));
  };

  const handleReset = async () => {
    refresh(await resetWatchlistSynced());
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleAdd();
            }
          }}
          placeholder="输入股票代码，如 AMD"
          className="min-h-11 flex-1 rounded-md border border-terminal-border bg-terminal-bg px-3 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md border border-terminal-cyan/40 bg-terminal-panelSoft px-4 py-2 text-sm font-medium text-terminal-cyan hover:border-terminal-cyan"
        >
          添加
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-terminal-border bg-terminal-panelSoft px-4 py-2 text-sm text-terminal-muted hover:text-terminal-text"
        >
          重置默认
        </button>
      </div>

      <div className="text-xs text-terminal-muted">
        当前自选股：{symbols.join(", ")} · {syncLabel}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="border-b border-terminal-border text-sm text-terminal-muted">
              <th className="pb-3 font-medium">代码</th>
              <th className="pb-3 font-medium">公司</th>
              <th className="pb-3 font-medium">板块</th>
              <th className="pb-3 font-medium">行业</th>
              <th className="pb-3 text-right font-medium">价格</th>
              <th className="pb-3 text-right font-medium">涨跌幅</th>
              <th className="pb-3 text-right font-medium">市值</th>
              <th className="pb-3 text-right font-medium">PE</th>
              <th className="pb-3 text-right font-medium">PS</th>
              <th className="pb-3 text-right font-medium">数据来源</th>
              <th className="pb-3 text-right font-medium">风险</th>
              <th className="pb-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.symbol}
                className="border-b border-terminal-border/70 text-sm last:border-0"
              >
                <td className="py-4">
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    className="font-semibold text-terminal-cyan hover:text-terminal-text"
                  >
                    {stock.symbol}
                  </Link>
                </td>
                <td className="py-4 text-terminal-text">{stock.companyName}</td>
                <td className="py-4 text-terminal-muted">{stock.sector}</td>
                <td className="py-4 text-terminal-muted">{stock.industry}</td>
                <td className="py-4 text-right text-terminal-text">
                  {formatPrice(stock.price)}
                </td>
                <td
                  className={`py-4 text-right font-medium ${
                    (stock.changePercent ?? 0) >= 0
                      ? "text-terminal-green"
                      : "text-terminal-red"
                  }`}
                >
                  {formatPercent(stock.changePercent)}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {stock.marketCap}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {stock.peRatio ?? "—"}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {stock.psRatio ?? "—"}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {getDataSourceLabel(stock)}
                </td>
                <td className="py-4 text-right text-terminal-muted">
                  {stock.riskLevel}
                </td>
                <td className="py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemove(stock.symbol)}
                    className="rounded border border-terminal-red/35 px-3 py-1 text-xs text-terminal-red hover:border-terminal-red"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
