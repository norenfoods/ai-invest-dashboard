import { notFound } from "next/navigation";
import DataStatusBar from "@/components/DataStatusBar";
import DashboardCard from "@/components/DashboardCard";
import MetricCard from "@/components/MetricCard";
import StockChart from "@/components/StockChart";
import { analyzeStock } from "@/lib/ai/analyzeStock";
import { getIncomeStatement } from "@/lib/api/fmp";
import { watchlistStocks } from "@/lib/mockData";
import { getAlertsForStock } from "@/lib/services/alertService";
import { getStockBySymbol } from "@/lib/services/stockService";
import type { AlertLevel } from "@/lib/rules/alertRules";

export const revalidate = 300;

type StockDetailPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export function generateStaticParams() {
  return watchlistStocks.map((stock) => ({ symbol: stock.symbol }));
}

const alertLevelClass: Record<AlertLevel, string> = {
  high: "border-terminal-red/40 text-terminal-red",
  medium: "border-terminal-amber/40 text-terminal-amber",
  low: "border-terminal-cyan/40 text-terminal-cyan",
};

const alertLevelLabel: Record<AlertLevel, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const alertTypeLabel = {
  highValuation: "高估值",
  negativeGrowth: "负增长",
  lowMargin: "低利润率",
  earningsSoon: "财报临近",
  highDailyMove: "日内波动",
  singlePositionTooHigh: "持仓集中",
  portfolioLoss: "组合回撤",
  highRiskHolding: "高风险持仓",
};

const dataSourceLabel = {
  fmp: "FMP",
  yahoo: "Yahoo",
  mock: "Mock",
  none: "Missing",
};

const fundamentalsSourceLabel = {
  fmp: "FMP",
  mock: "Mock",
  missing: "Missing",
};

const getDataSourceLabel = (stock: {
  dataStatus: "live" | "fallback" | "missing";
  dataSource?: "fmp" | "yahoo" | "mock" | "none";
}): string => {
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

const getFundamentalsSourceLabel = (stock: {
  fundamentalsDataSource?: "fmp" | "mock" | "missing";
}): string => fundamentalsSourceLabel[stock.fundamentalsDataSource ?? "mock"];

const formatPrice = (value: number | null): string =>
  value === null ? "暂无实时价格" : `$${value.toFixed(2)}`;

const formatNumber = (value: number | null): string =>
  value === null ? "暂无数据" : value.toString();

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)}%`;

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = await params;
  const stock = await getStockBySymbol(symbol);

  if (!stock) {
    notFound();
  }

  const incomeStatement = await getIncomeStatement(stock.symbol);
  const [aiAnalysis, stockAlerts] = await Promise.all([
    analyzeStock(stock, incomeStatement, stock.news),
    getAlertsForStock(stock.symbol),
  ]);
  const changeTone = (stock.changePercent ?? 0) >= 0 ? "positive" : "negative";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-terminal-cyan">Stock Detail 个股详情页</p>
          <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
            {stock.companyName} · {stock.symbol}
          </h1>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-panel px-4 py-2 text-sm text-terminal-muted">
          {stock.sector} · {stock.industry} · 价格来源：{getDataSourceLabel(stock)} · 基本面来源：{getFundamentalsSourceLabel(stock)}
        </div>
      </div>

      <DataStatusBar />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="当前价格" value={formatPrice(stock.price)} />
        <MetricCard
          label="今日涨跌幅"
          value={
            stock.changePercent === null
              ? "—"
              : `${stock.changePercent > 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`
          }
          subValue={
            stock.change === null
              ? "—"
              : `${stock.change > 0 ? "+" : ""}${stock.change.toFixed(2)}`
          }
          tone={changeTone}
        />
        <MetricCard label="市值" value={stock.marketCap} />
        <MetricCard label="PE" value={formatNumber(stock.peRatio)} />
        <MetricCard label="PS" value={formatNumber(stock.psRatio)} />
        <MetricCard
          label="营收增长率"
          value={formatPercent(stock.revenueGrowth)}
          tone={(stock.revenueGrowth ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="毛利率"
          value={formatPercent(stock.grossMargin)}
          tone={(stock.grossMargin ?? 0) >= 50 ? "positive" : "warning"}
        />
        <MetricCard
          label="净利率"
          value={formatPercent(stock.netMargin)}
          tone={(stock.netMargin ?? 0) >= 20 ? "positive" : "warning"}
        />
        <MetricCard
          label="下次财报日"
          value={stock.nextEarningsDate}
          subValue={`风险等级：${stock.riskLevel}`}
          tone={
            stock.riskLevel === "高"
              ? "negative"
              : stock.riskLevel === "中"
                ? "warning"
                : "positive"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <DashboardCard title="股价折线图" eyebrow={`${stock.symbol} Price Trend`}>
          <StockChart
            data={stock.chart}
            color={(stock.changePercent ?? 0) >= 0 ? "#19C37D" : "#FF5C7A"}
          />
        </DashboardCard>

        <DashboardCard title="AI 个股分析摘要" eyebrow="AI Stock Brief">
          <p className="text-sm leading-7 text-terminal-muted">
            {aiAnalysis.summary}
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-3">
              <div className="text-xs text-terminal-muted">优势</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-text">
                {aiAnalysis.strengths.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-3">
              <div className="text-xs text-terminal-muted">风险</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-text">
                {aiAnalysis.risks.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/60 p-3">
              <div className="text-xs text-terminal-muted">观察点</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-text">
                {aiAnalysis.watchPoints.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 text-xs text-terminal-muted">
            {aiAnalysis.disclaimer}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="个股新闻" eyebrow={`${stock.symbol} Stock News`}>
        <div className="grid gap-3 md:grid-cols-2">
          {stock.news.map((item) => {
            const content = (
              <article className="h-full rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4">
                <div className="text-xs text-terminal-muted">
                  {item.publisher} · {item.publishedDate || "时间待确认"}
                </div>
                <h2 className="mt-2 text-sm font-semibold leading-6 text-terminal-text">
                  {item.title}
                </h2>
              </article>
            );

            return item.url ? (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block hover:border-terminal-cyan/50"
              >
                {content}
              </a>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })}
        </div>
      </DashboardCard>

      <DashboardCard title="个股风险预警" eyebrow={`${stock.symbol} Rule Alerts`}>
        {stockAlerts.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {stockAlerts.map((alert) => (
              <article
                key={alert.id}
                className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-terminal-muted">
                      {alert.symbol} · {alert.companyName}
                    </div>
                    <h2 className="mt-1 text-sm font-semibold text-terminal-text">
                      {alertTypeLabel[alert.type]}
                    </h2>
                  </div>
                  <span
                    className={`rounded border px-2 py-1 text-xs ${alertLevelClass[alert.level]}`}
                  >
                    {alertLevelLabel[alert.level]}风险
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-terminal-muted">
                  {alert.message}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4 text-sm text-terminal-muted">
            当前个股未触发规则预警。
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
