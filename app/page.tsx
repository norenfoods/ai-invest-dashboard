import AlertsList from "@/components/AlertsList";
import Link from "next/link";
import DashboardWatchlistRanking from "@/components/DashboardWatchlistRanking";
import DashboardCard from "@/components/DashboardCard";
import DataStatusBar from "@/components/DataStatusBar";
import MetricCard from "@/components/MetricCard";
import PortfolioSummaryCard from "@/components/PortfolioSummaryCard";
import { getLatestMorningBrief } from "@/lib/agent/saveMorningBrief";
import { aiMarketSummary } from "@/lib/mockData";
import { getAlertsForWatchlist } from "@/lib/services/alertService";
import { getIndexQuotes, getWatchlistStocks } from "@/lib/services/stockService";

export const revalidate = 300;

const formatChange = (value: number, percent: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(2)} / ${percent > 0 ? "+" : ""}${percent.toFixed(2)}%`;

export default async function DashboardPage() {
  const [indexQuotes, watchlistStocks, alerts, latestMorningBrief] = await Promise.all([
    getIndexQuotes(),
    getWatchlistStocks(),
    getAlertsForWatchlist(),
    getLatestMorningBrief(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-terminal-cyan">Dashboard 首页</p>
          <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
            今日美股研究总览
          </h1>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-panel px-4 py-2 text-sm text-terminal-muted">
          数据源：Mock Data · 更新时间：盘中模拟
        </div>
      </div>

      <DataStatusBar />

      <div className="grid gap-4 md:grid-cols-3">
        {indexQuotes.map((quote) => (
          <MetricCard
            key={quote.symbol}
            label={`${quote.name} · ${quote.symbol}`}
            value={quote.value}
            subValue={`${formatChange(quote.change, quote.changePercent)} · ${quote.breadth}`}
            tone={quote.changePercent >= 0 ? "positive" : "negative"}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <DashboardCard title="自选股涨跌排行" eyebrow="Watchlist Ranking">
          <DashboardWatchlistRanking initialStocks={watchlistStocks} />
        </DashboardCard>

        <div className="space-y-6">
          <DashboardCard title="持仓摘要" eyebrow="Portfolio Summary">
            <PortfolioSummaryCard initialStocks={watchlistStocks} />
          </DashboardCard>

          <DashboardCard title="最新 Morning Brief" eyebrow="AI Morning Brief">
            {latestMorningBrief ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-terminal-text">
                      {latestMorningBrief.title}
                    </div>
                    <div className="mt-1 text-xs text-terminal-muted">
                      归档日期：{latestMorningBrief.date}
                    </div>
                  </div>
                  <Link
                    href="/morning-brief/archive"
                    className="rounded-md border border-terminal-cyan/40 px-3 py-2 text-xs font-medium text-terminal-cyan hover:border-terminal-cyan"
                  >
                    查看归档
                  </Link>
                </div>
                <p className="border-l-2 border-terminal-cyan/60 pl-3 text-sm leading-6 text-terminal-muted">
                  {latestMorningBrief.summary}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-terminal-muted">
                  暂无已归档 Morning Brief。配置 Supabase 和 Cron 后会每天自动保存，也可以先打开 Morning Brief 页面生成当天简报。
                </p>
                <Link
                  href="/morning-brief"
                  className="inline-flex rounded-md border border-terminal-cyan/40 px-3 py-2 text-xs font-medium text-terminal-cyan hover:border-terminal-cyan"
                >
                  生成 Morning Brief
                </Link>
              </div>
            )}
          </DashboardCard>

          <DashboardCard title="AI 今日市场摘要" eyebrow="AI Market Brief">
            <div className="space-y-4">
              {aiMarketSummary.map((item) => (
                <p
                  key={item}
                  className="border-l-2 border-terminal-cyan/60 pl-3 text-sm leading-6 text-terminal-muted"
                >
                  {item}
                </p>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard title="风险预警列表" eyebrow="Risk Monitor">
            <AlertsList initialAlerts={alerts} limit={3} />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
