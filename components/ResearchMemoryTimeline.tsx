"use client";

import { useMemo, useState } from "react";
import type {
  ResearchMemoryCategory,
  ResearchMemoryItem,
} from "@/lib/agent/researchMemory";

type ResearchMemoryTimelineProps = {
  items: ResearchMemoryItem[];
};

const categoryLabel: Record<ResearchMemoryCategory, string> = {
  daily_observation: "历史 AI 观察",
  risk_change: "风险变化",
  sector_state: "板块状态",
  stock_state: "重点股票状态",
};

const categoryClass: Record<ResearchMemoryCategory, string> = {
  daily_observation: "border-terminal-cyan/50 text-terminal-cyan",
  risk_change: "border-terminal-red/50 text-terminal-red",
  sector_state: "border-terminal-amber/50 text-terminal-amber",
  stock_state: "border-terminal-green/50 text-terminal-green",
};

export default function ResearchMemoryTimeline({
  items,
}: ResearchMemoryTimelineProps) {
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState("");
  const [category, setCategory] = useState<ResearchMemoryCategory | "">("");
  const [tag, setTag] = useState("");

  const symbols = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.symbol).filter(Boolean) as string[]),
      ).sort(),
    [items],
  );
  const tags = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags))).sort(),
    [items],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.date} ${item.title} ${item.content} ${item.symbol ?? ""} ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesSymbol = !symbol || item.symbol === symbol;
      const matchesCategory = !category || item.category === category;
      const matchesTag = !tag || item.tags.includes(tag);

      return matchesQuery && matchesSymbol && matchesCategory && matchesTag;
    });
  }, [category, items, query, symbol, tag]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-5 shadow-panel">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
            Filters
          </div>
          <h2 className="mt-1 text-lg font-semibold text-terminal-text">
            研究记忆筛选
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、正文、标签"
            className="rounded-md border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none placeholder:text-terminal-muted focus:border-terminal-cyan/60"
          />
          <select
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="rounded-md border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-cyan/60"
          >
            <option value="">全部股票</option>
            {symbols.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ResearchMemoryCategory | "")
            }
            className="rounded-md border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-cyan/60"
          >
            <option value="">全部类型</option>
            {Object.entries(categoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="rounded-md border border-terminal-border bg-terminal-panelSoft px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-cyan/60"
          >
            <option value="">全部板块 / 风险标签</option>
            {tags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-5 shadow-panel">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-terminal-cyan">
              Timeline
            </div>
            <h2 className="mt-1 text-lg font-semibold text-terminal-text">
              时间线视图
            </h2>
          </div>
          <div className="text-sm text-terminal-muted">
            {filteredItems.length} 条记忆
          </div>
        </div>

        {filteredItems.length ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="relative rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-terminal-text">
                        {item.date}
                      </span>
                      <span
                        className={`rounded border px-2 py-1 text-xs ${categoryClass[item.category]}`}
                      >
                        {categoryLabel[item.category]}
                      </span>
                      {item.symbol ? (
                        <span className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-muted">
                          {item.symbol}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-terminal-text">
                      {item.title}
                    </h3>
                  </div>
                  <div className="text-xs text-terminal-muted">
                    {new Date(item.created_at).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-terminal-muted">
                  {item.content}
                </p>
                {item.tags.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((itemTag) => (
                      <span
                        key={itemTag}
                        className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-muted"
                      >
                        #{itemTag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4 text-sm text-terminal-muted">
            没有匹配的研究记忆。
          </div>
        )}
      </section>
    </div>
  );
}
