import Link from "next/link";
import DataStatusBar from "@/components/DataStatusBar";
import DashboardCard from "@/components/DashboardCard";
import EarningsTrendChart from "@/components/EarningsTrendChart";
import MetricCard from "@/components/MetricCard";
import { watchlistStocks } from "@/lib/mockData";
import { getEarningsAnalysis, type EarningsRisk } from "@/lib/services/earningsService";

export const revalidate = 300;

type EarningsPageProps = {
  searchParams?: Promise<{
    symbol?: string;
  }>;
};

const riskClass: Record<EarningsRisk["level"], string> = {
  高: "border-terminal-red/40 text-terminal-red",
  中: "border-terminal-amber/40 text-terminal-amber",
  低: "border-terminal-cyan/40 text-terminal-cyan",
};

const dataStatusLabel = {
  live: "FMP 真实财报数据",
  fallback: "使用 mock fallback",
};

const formatCurrency = (value: number | null): string => {
  if (value === null) {
    return "—";
  }

  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  return `$${value.toLocaleString("en-US")}`;
};

const formatNumber = (value: number | null): string =>
  value === null ? "—" : value.toFixed(2);

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(1)}%`;

export default async function EarningsPage({ searchParams }: EarningsPageProps) {
  const params = await searchParams;
  const requestedSymbol = params?.symbol ?? "NVDA";
  const analysis = await getEarningsAnalysis(requestedSymbol);
  const latest = analysis.years.at(-1);
  const previous = analysis.years.at(-2);
  const revenueGrowth =
    latest?.revenue && previous?.revenue
      ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
      : null;
  const chartData = analysis.years.map((item, index) => {
    const priorRevenue = analysis.years[index - 1]?.revenue;

    return {
      year: item.year,
      revenueGrowth:
        item.revenue && priorRevenue
          ? ((item.revenue - priorRevenue) / priorRevenue) * 100
          : null,
      netIncome: item.netIncome,
      freeCashFlow: item.freeCashFlow,
      grossMargin: item.grossMargin,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-terminal-cyan">Earnings Analysis 财报分析中心</p>
          <h1 className="mt-2 text-3xl font-semibold text-terminal-text">
            {analysis.companyName} · {analysis.symbol} 财报质量研究
          </h1>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-panel px-4 py-2 text-sm text-terminal-muted">
          {dataStatusLabel[analysis.dataStatus]} · 最近 5 年
        </div>
      </div>

      <DataStatusBar />

      <div className="flex flex-wrap gap-2">
        {watchlistStocks.map((stock) => (
          <Link
            key={stock.symbol}
            href={`/earnings?symbol=${stock.symbol}`}
            className={`rounded border px-3 py-2 text-sm transition ${
              stock.symbol === analysis.symbol
                ? "border-terminal-cyan/60 bg-terminal-panelSoft text-terminal-text"
                : "border-terminal-border bg-terminal-panel text-terminal-muted hover:border-terminal-cyan/50 hover:text-terminal-text"
            }`}
          >
            {stock.symbol}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="最新年度 Revenue"
          value={formatCurrency(latest?.revenue ?? null)}
          subValue={`同比 ${formatPercent(revenueGrowth)}`}
          tone={(revenueGrowth ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="最新年度 Net Income"
          value={formatCurrency(latest?.netIncome ?? null)}
          tone={(latest?.netIncome ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="最新年度 Free Cash Flow"
          value={formatCurrency(latest?.freeCashFlow ?? null)}
          tone={(latest?.freeCashFlow ?? 0) >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="最新年度 EPS"
          value={formatNumber(latest?.eps ?? null)}
          tone={(latest?.eps ?? 0) >= (previous?.eps ?? 0) ? "positive" : "warning"}
        />
      </div>

      <DashboardCard title="最近 5 年核心财报指标" eyebrow="Financial Statements">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-terminal-muted">
              <tr className="border-b border-terminal-border">
                <th className="pb-3 font-medium">年度</th>
                <th className="pb-3 text-right font-medium">Revenue</th>
                <th className="pb-3 text-right font-medium">Gross Profit</th>
                <th className="pb-3 text-right font-medium">Operating Income</th>
                <th className="pb-3 text-right font-medium">Net Income</th>
                <th className="pb-3 text-right font-medium">Free Cash Flow</th>
                <th className="pb-3 text-right font-medium">EPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/70">
              {analysis.years.map((item) => (
                <tr key={item.year} className="text-terminal-text">
                  <td className="py-3 font-medium">{item.year}</td>
                  <td className="py-3 text-right">{formatCurrency(item.revenue)}</td>
                  <td className="py-3 text-right">{formatCurrency(item.grossProfit)}</td>
                  <td className="py-3 text-right">{formatCurrency(item.operatingIncome)}</td>
                  <td className="py-3 text-right">{formatCurrency(item.netIncome)}</td>
                  <td className="py-3 text-right">{formatCurrency(item.freeCashFlow)}</td>
                  <td className="py-3 text-right">{formatNumber(item.eps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="营收增长趋势" eyebrow="Revenue Trend">
          <EarningsTrendChart
            data={chartData}
            dataKey="revenueGrowth"
            label="Revenue YoY"
            color="#45C7E8"
            unit="percent"
          />
        </DashboardCard>
        <DashboardCard title="净利润趋势" eyebrow="Net Income Trend">
          <EarningsTrendChart
            data={chartData}
            dataKey="netIncome"
            label="Net Income"
            color="#19C37D"
          />
        </DashboardCard>
        <DashboardCard title="自由现金流趋势" eyebrow="Free Cash Flow Trend">
          <EarningsTrendChart
            data={chartData}
            dataKey="freeCashFlow"
            label="Free Cash Flow"
            color="#F6C85F"
          />
        </DashboardCard>
        <DashboardCard title="毛利率趋势" eyebrow="Gross Margin Trend">
          <EarningsTrendChart
            data={chartData}
            dataKey="grossMargin"
            label="Gross Margin"
            color="#FF8A5B"
            unit="percent"
          />
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard title="AI 财报摘要" eyebrow="AI Earnings Brief">
          <div className="grid gap-3">
            {[
              ["增长趋势", analysis.aiSummary.growthTrend],
              ["盈利质量", analysis.aiSummary.profitQuality],
              ["现金流质量", analysis.aiSummary.cashFlowQuality],
              ["债务风险", analysis.aiSummary.debtRisk],
            ].map(([label, content]) => (
              <div
                key={label}
                className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4"
              >
                <div className="text-xs text-terminal-muted">{label}</div>
                <p className="mt-2 text-sm leading-6 text-terminal-text">{content}</p>
              </div>
            ))}
            <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4">
              <div className="text-xs text-terminal-muted">后续观察点</div>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-terminal-text">
                {analysis.aiSummary.watchPoints.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 text-xs text-terminal-muted">
            {analysis.aiSummary.disclaimer}
          </div>
        </DashboardCard>

        <DashboardCard title="财报风险规则" eyebrow="Earnings Risk Rules">
          {analysis.risks.length > 0 ? (
            <div className="grid gap-3">
              {analysis.risks.map((risk) => (
                <article
                  key={risk.id}
                  className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-sm font-semibold text-terminal-text">
                      {risk.title}
                    </h2>
                    <span className={`rounded border px-2 py-1 text-xs ${riskClass[risk.level]}`}>
                      {risk.level}风险
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-terminal-muted">
                    {risk.description}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/55 p-4 text-sm text-terminal-muted">
              当前最近 5 年数据未触发财报风险规则。
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
