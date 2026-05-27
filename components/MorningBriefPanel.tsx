"use client";

import { useEffect, useState } from "react";
import DashboardCard from "@/components/DashboardCard";
import type { MorningBrief, MorningBriefQuote } from "@/lib/agent/morningBrief";
import { getPositions } from "@/lib/portfolio/portfolioStore";
import { getWatchlistSymbols } from "@/lib/watchlist/watchlistStore";

type MorningBriefPanelProps = {
  initialBrief: MorningBrief;
};

const dataStatusLabel: Record<MorningBriefQuote["dataStatus"], string> = {
  live: "实时",
  fallback: "fallback",
  missing: "缺失",
};

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

const toneClass = (value: number | null): string => {
  if (value === null) {
    return "text-terminal-muted";
  }

  return value >= 0 ? "text-terminal-green" : "text-terminal-red";
};

const sectionMarkdown = (title: string, lines: string[]): string =>
  [`## ${title}`, ...lines.map((line) => `- ${line}`)].join("\n");

const buildMarkdown = (brief: MorningBrief): string =>
  [
    "# AI Morning Brief",
    "",
    `生成时间：${new Date(brief.generatedAt).toLocaleString("zh-CN")}`,
    "",
    `> ${brief.oneLineSummary}`,
    "",
    sectionMarkdown(
      "指数表现",
      brief.indexes.map(
        (item) =>
          `${item.label}：${item.value}，涨跌幅 ${formatPercent(item.changePercent)}，数据状态 ${dataStatusLabel[item.dataStatus]}`,
      ),
    ),
    "",
    sectionMarkdown(
      "利率与宏观",
      brief.macro.map(
        (item) =>
          `${item.label}：${item.value}，涨跌幅 ${formatPercent(item.changePercent)}，数据状态 ${dataStatusLabel[item.dataStatus]}`,
      ),
    ),
    "",
    sectionMarkdown("过去 7 天市场变化", brief.last7DaysChanges),
    "",
    sectionMarkdown("AI 市场状态变化趋势", brief.marketStateTrends),
    "",
    sectionMarkdown("主线状态", [
      `AI 主线：${brief.aiThemeStatus}`,
      `半导体：${brief.semiconductorStatus}`,
      `软件股：${brief.softwareStatus}`,
    ]),
    "",
    sectionMarkdown("Watchlist 异动", brief.watchlistMoves),
    "",
    sectionMarkdown("财报提醒", brief.earningsReminders),
    "",
    sectionMarkdown("风险提示", brief.riskNotes),
    "",
    sectionMarkdown("明日观察重点", brief.tomorrowFocus),
    "",
    brief.disclaimer,
  ].join("\n");

async function fetchMorningBrief(
  refresh = false,
): Promise<MorningBrief | null> {
  try {
    const response = await fetch("/api/morning-brief", {
      method: refresh ? "POST" : "GET",
      headers: refresh ? { "content-type": "application/json" } : undefined,
      body: refresh
        ? JSON.stringify({
            symbols: getWatchlistSymbols(),
            positions: getPositions(),
            refresh: true,
          })
        : undefined,
    });
    const data = (await response.json()) as {
      brief: MorningBrief | null;
      lastUpdated?: string;
      error?: string;
    };
    const error = data.error ?? (!response.ok ? "Morning Brief 生成失败。" : undefined);

    window.dispatchEvent(
      new CustomEvent(error ? "app:data-error" : "app:data-updated", {
        detail: { lastUpdated: data.lastUpdated, message: error },
      }),
    );

    return data.brief;
  } catch {
    window.dispatchEvent(new CustomEvent("app:data-error"));
    return null;
  }
}

function QuoteGrid({ items }: { items: MorningBriefQuote[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.symbol}
          className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-terminal-text">
                {item.label}
              </div>
              <div className="mt-1 text-xs text-terminal-muted">
                {dataStatusLabel[item.dataStatus]}
              </div>
            </div>
            <div className={`text-sm font-semibold ${toneClass(item.changePercent)}`}>
              {formatPercent(item.changePercent)}
            </div>
          </div>
          <div className="mt-3 text-2xl font-semibold text-terminal-text">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function BriefList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-terminal-muted">
      {items.map((item) => (
        <li key={item}>· {item}</li>
      ))}
    </ul>
  );
}

export default function MorningBriefPanel({
  initialBrief,
}: MorningBriefPanelProps) {
  const [brief, setBrief] = useState(initialBrief);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const refresh = (forceRefresh = false) => {
      void fetchMorningBrief(forceRefresh).then((nextBrief) => {
        if (nextBrief) {
          setBrief(nextBrief);
        }
      });
    };
    const handleAppRefresh = () => refresh(true);
    const handleRegularRefresh = () => refresh(false);

    refresh();
    window.addEventListener("app:refresh-data", handleAppRefresh);
    window.addEventListener("watchlist:changed", handleRegularRefresh);
    window.addEventListener("portfolio:changed", handleRegularRefresh);
    window.addEventListener("storage", handleRegularRefresh);

    return () => {
      window.removeEventListener("app:refresh-data", handleAppRefresh);
      window.removeEventListener("watchlist:changed", handleRegularRefresh);
      window.removeEventListener("portfolio:changed", handleRegularRefresh);
      window.removeEventListener("storage", handleRegularRefresh);
    };
  }, []);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    const nextBrief = await fetchMorningBrief(true);

    if (nextBrief) {
      setBrief(nextBrief);
    }

    setIsRegenerating(false);
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([buildMarkdown(brief)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ai-morning-brief-${new Date(brief.generatedAt).toISOString().slice(0, 10)}.md`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DashboardCard title="今日一句话总结" eyebrow="Executive Read">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <p className="max-w-4xl text-base leading-7 text-terminal-text">
            {brief.oneLineSummary}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="rounded-md border border-terminal-cyan/40 px-3 py-2 text-xs font-medium text-terminal-cyan hover:border-terminal-cyan disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegenerating ? "生成中" : "重新生成简报"}
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="rounded-md border border-terminal-border px-3 py-2 text-xs font-medium text-terminal-muted hover:border-terminal-cyan/50 hover:text-terminal-text"
            >
              导出 Markdown
            </button>
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
        <div className="space-y-6">
          <DashboardCard title="指数表现" eyebrow="SPY · QQQ · DIA · IWM · SOXX · VIX">
            <QuoteGrid items={brief.indexes} />
          </DashboardCard>

          <DashboardCard title="主线状态" eyebrow="Themes">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-4">
                <div className="text-sm font-semibold text-terminal-cyan">
                  AI 主线
                </div>
                <p className="mt-3 text-sm leading-6 text-terminal-muted">
                  {brief.aiThemeStatus}
                </p>
              </div>
              <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-4">
                <div className="text-sm font-semibold text-terminal-cyan">
                  半导体
                </div>
                <p className="mt-3 text-sm leading-6 text-terminal-muted">
                  {brief.semiconductorStatus}
                </p>
              </div>
              <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-4">
                <div className="text-sm font-semibold text-terminal-cyan">
                  软件股
                </div>
                <p className="mt-3 text-sm leading-6 text-terminal-muted">
                  {brief.softwareStatus}
                </p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="过去 7 天市场变化" eyebrow="Research Memory">
            <BriefList items={brief.last7DaysChanges} />
          </DashboardCard>

          <DashboardCard title="AI 市场状态变化趋势" eyebrow="State Trends">
            <BriefList items={brief.marketStateTrends} />
          </DashboardCard>

          <DashboardCard title="Watchlist 异动" eyebrow="High Signal Moves">
            <BriefList items={brief.watchlistMoves} />
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard title="利率与宏观" eyebrow="Rates · Dollar · Oil · Crypto">
            <QuoteGrid items={brief.macro} />
          </DashboardCard>

          <DashboardCard title="财报提醒" eyebrow="Earnings Calendar">
            <BriefList items={brief.earningsReminders} />
          </DashboardCard>

          <DashboardCard title="风险提示" eyebrow="Risk Monitor">
            <BriefList items={brief.riskNotes} />
          </DashboardCard>

          <DashboardCard title="明日观察重点" eyebrow="Next Session">
            <BriefList items={brief.tomorrowFocus} />
            <div className="mt-5 border-t border-terminal-border pt-4 text-xs text-terminal-muted">
              {brief.disclaimer}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
