import "server-only";

import {
  getBalanceSheetStatements,
  getCashFlowStatements,
  getIncomeStatement,
  type FmpBalanceSheetStatement,
  type FmpCashFlowStatement,
  type FmpIncomeStatement,
} from "@/lib/api/fmp";
import { generateJsonWithOpenAI } from "@/lib/ai/openaiClient";
import { getCache, setCache } from "@/lib/cache/simpleCache";
import { watchlistStocks } from "@/lib/mockData";

const AI_EARNINGS_TTL = 30 * 60_000;
const DISCLAIMER = "仅供研究参考，不构成投资建议。";

export type EarningsYearPoint = {
  year: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  freeCashFlow: number | null;
  eps: number | null;
  grossMargin: number | null;
  debtRatio: number | null;
};

export type EarningsRisk = {
  id: string;
  level: "高" | "中" | "低";
  title: string;
  description: string;
};

export type EarningsAISummary = {
  growthTrend: string;
  profitQuality: string;
  cashFlowQuality: string;
  debtRisk: string;
  watchPoints: string[];
  disclaimer: string;
};

export type EarningsAnalysis = {
  symbol: string;
  companyName: string;
  dataStatus: "live" | "fallback";
  years: EarningsYearPoint[];
  risks: EarningsRisk[];
  aiSummary: EarningsAISummary;
};

const toYear = (
  item: Pick<FmpIncomeStatement | FmpBalanceSheetStatement | FmpCashFlowStatement, "date" | "calendarYear">,
): string => item.calendarYear ?? item.date?.slice(0, 4) ?? "";

const roundedPercent = (value: number | null): number | null =>
  value === null || !Number.isFinite(value) ? null : Number(value.toFixed(1));

const calculateMargin = (numerator?: number | null, denominator?: number | null) => {
  if (!numerator || !denominator) {
    return null;
  }

  return roundedPercent((numerator / denominator) * 100);
};

const calculateDebtRatio = (liabilities?: number | null, assets?: number | null) => {
  if (!liabilities || !assets) {
    return null;
  }

  return roundedPercent((liabilities / assets) * 100);
};

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const findStockName = (symbol: string) =>
  watchlistStocks.find((stock) => stock.symbol === symbol)?.companyName ?? symbol;

const buildMockStatements = (symbol: string): EarningsYearPoint[] => {
  const profiles: Record<string, { revenue: number; growth: number[]; margin: number; netMargin: number; fcfMargin: number; debtRatio: number; eps: number }> = {
    AAPL: { revenue: 365_817_000_000, growth: [1.0, 1.08, 1.04, 0.97, 1.02], margin: 45.9, netMargin: 24.3, fcfMargin: 25.2, debtRatio: 78.5, eps: 6.12 },
    MSFT: { revenue: 168_088_000_000, growth: [1.0, 1.18, 1.21, 1.16, 1.15], margin: 69.4, netMargin: 35.8, fcfMargin: 30.4, debtRatio: 49.1, eps: 11.8 },
    NVDA: { revenue: 26_914_000_000, growth: [1.0, 1.01, 1.22, 2.25, 2.15], margin: 73.8, netMargin: 48.6, fcfMargin: 42.1, debtRatio: 31.8, eps: 12.9 },
    AMZN: { revenue: 469_822_000_000, growth: [1.0, 1.09, 1.12, 1.12, 1.11], margin: 47.6, netMargin: 7.8, fcfMargin: 8.2, debtRatio: 63.7, eps: 4.28 },
    GOOGL: { revenue: 257_637_000_000, growth: [1.0, 1.10, 1.09, 1.14, 1.13], margin: 57.1, netMargin: 26.7, fcfMargin: 23.6, debtRatio: 28.4, eps: 7.42 },
    META: { revenue: 117_929_000_000, growth: [1.0, 0.99, 1.16, 1.22, 1.17], margin: 81.2, netMargin: 31.3, fcfMargin: 28.9, debtRatio: 24.2, eps: 23.12 },
    TSLA: { revenue: 53_823_000_000, growth: [1.0, 1.51, 1.19, 1.04, 0.93], margin: 18.2, netMargin: 6.9, fcfMargin: -1.8, debtRatio: 41.5, eps: 2.42 },
  };
  const profile = profiles[symbol] ?? {
    revenue: 50_000_000_000,
    growth: [1.0, 1.07, 1.05, 1.04, 1.03],
    margin: 42,
    netMargin: 15,
    fcfMargin: 10,
    debtRatio: 45,
    eps: 3.5,
  };

  return ["2021", "2022", "2023", "2024", "2025"].map((year, index) => {
    const revenue = profile.growth
      .slice(0, index + 1)
      .reduce((value, multiplier) => value * multiplier, profile.revenue);
    const eps = profile.eps * profile.growth.slice(1, index + 1).reduce((value, multiplier) => value * (0.9 + multiplier * 0.1), 1);

    return {
      year,
      revenue: Math.round(revenue),
      grossProfit: Math.round(revenue * (profile.margin / 100)),
      operatingIncome: Math.round(revenue * ((profile.netMargin + 8) / 100)),
      netIncome: Math.round(revenue * (profile.netMargin / 100)),
      freeCashFlow: Math.round(revenue * (profile.fcfMargin / 100)),
      eps: Number(eps.toFixed(2)),
      grossMargin: profile.margin,
      debtRatio: profile.debtRatio,
    };
  });
};

const buildYearRows = (
  incomeStatements: FmpIncomeStatement[],
  balanceSheets: FmpBalanceSheetStatement[],
  cashFlows: FmpCashFlowStatement[],
): EarningsYearPoint[] => {
  const balanceByYear = new Map(balanceSheets.map((item) => [toYear(item), item]));
  const cashFlowByYear = new Map(cashFlows.map((item) => [toYear(item), item]));

  return incomeStatements
    .map((income) => {
      const year = toYear(income);
      const balance = balanceByYear.get(year);
      const cashFlow = cashFlowByYear.get(year);
      const freeCashFlow =
        cashFlow?.freeCashFlow ??
        (cashFlow?.operatingCashFlow && cashFlow?.capitalExpenditure
          ? cashFlow.operatingCashFlow + cashFlow.capitalExpenditure
          : null);

      return {
        year,
        revenue: income.revenue ?? null,
        grossProfit: income.grossProfit ?? null,
        operatingIncome: income.operatingIncome ?? null,
        netIncome: income.netIncome ?? null,
        freeCashFlow,
        eps: income.epsdiluted ?? income.eps ?? null,
        grossMargin: calculateMargin(income.grossProfit, income.revenue),
        debtRatio: calculateDebtRatio(
          balance?.totalLiabilities ?? balance?.totalDebt,
          balance?.totalAssets,
        ),
      };
    })
    .filter((item) => item.year)
    .sort((a, b) => a.year.localeCompare(b.year))
    .slice(-5);
};

const isDeclining = (latest: number | null, previous: number | null) =>
  latest !== null && previous !== null && latest < previous;

export function evaluateEarningsRisks(years: EarningsYearPoint[]): EarningsRisk[] {
  const latest = years.at(-1);
  const previous = years.at(-2);
  const twoYearsAgo = years.at(-3);
  const risks: EarningsRisk[] = [];

  if (
    latest &&
    previous &&
    twoYearsAgo &&
    isDeclining(latest.revenue, previous.revenue) &&
    isDeclining(previous.revenue, twoYearsAgo.revenue)
  ) {
    risks.push({
      id: "revenue-decline-two-years",
      level: "高",
      title: "连续两年营收下滑",
      description: "最近两期营收均低于前一年，需关注需求、竞争格局或业务结构变化。",
    });
  }

  if ((latest?.freeCashFlow ?? 0) < 0) {
    risks.push({
      id: "negative-fcf",
      level: "高",
      title: "自由现金流为负",
      description: "最新年度自由现金流为负，需关注经营现金流、资本开支和现金消耗速度。",
    });
  }

  if ((latest?.debtRatio ?? 0) >= 70) {
    risks.push({
      id: "high-debt-ratio",
      level: "中",
      title: "负债率偏高",
      description: "最新年度负债率超过 70%，需关注再融资压力、利息成本和资产负债表弹性。",
    });
  }

  if (isDeclining(latest?.eps ?? null, previous?.eps ?? null)) {
    risks.push({
      id: "eps-decline",
      level: "中",
      title: "EPS 下滑",
      description: "最新年度 EPS 低于上一年度，需关注盈利释放、股本变化和一次性项目影响。",
    });
  }

  return risks;
}

const buildFallbackSummary = (
  symbol: string,
  years: EarningsYearPoint[],
  risks: EarningsRisk[],
): EarningsAISummary => {
  const latest = years.at(-1);
  const previous = years.at(-2);
  const revenueDirection =
    latest && previous && latest.revenue !== null && previous.revenue !== null
      ? latest.revenue >= previous.revenue
        ? "增长"
        : "下滑"
      : "待确认";

  return {
    growthTrend: `${symbol} 最近年度营收趋势为${revenueDirection}，需要结合分部收入、价格变化和需求周期继续拆解。`,
    profitQuality: `毛利率最新为 ${latest?.grossMargin?.toFixed(1) ?? "—"}%，净利润与经营利润的方向需要一起观察，避免只看单一利润指标。`,
    cashFlowQuality: `最新自由现金流为 ${latest?.freeCashFlow === null ? "—" : latest?.freeCashFlow.toLocaleString("en-US")}，现金流质量应结合营收增长和资本开支节奏判断。`,
    debtRisk: `最新负债率为 ${latest?.debtRatio?.toFixed(1) ?? "—"}%，${risks.some((risk) => risk.id === "high-debt-ratio") ? "资产负债表风险需要重点跟踪。" : "短期未触发高负债率规则。"}`,
    watchPoints: [
      "下一期营收增速是否延续当前方向。",
      "毛利率和经营利润率是否同步改善。",
      "自由现金流是否能覆盖资本开支和业务扩张需求。",
    ],
    disclaimer: DISCLAIMER,
  };
};

const normalizeSummary = (
  result: Partial<EarningsAISummary> | null,
  fallback: EarningsAISummary,
): EarningsAISummary => ({
  growthTrend: result?.growthTrend || fallback.growthTrend,
  profitQuality: result?.profitQuality || fallback.profitQuality,
  cashFlowQuality: result?.cashFlowQuality || fallback.cashFlowQuality,
  debtRisk: result?.debtRisk || fallback.debtRisk,
  watchPoints: result?.watchPoints?.length ? result.watchPoints : fallback.watchPoints,
  disclaimer: DISCLAIMER,
});

async function generateEarningsSummary(
  symbol: string,
  companyName: string,
  years: EarningsYearPoint[],
  risks: EarningsRisk[],
  forceRefresh = false,
): Promise<EarningsAISummary> {
  const fallback = buildFallbackSummary(symbol, years, risks);
  const cacheKey = `ai:earnings:${symbol}:${JSON.stringify({
    years,
    risks: risks.map((risk) => risk.id),
  })}`;

  try {
    if (!forceRefresh) {
      const cached = getCache<EarningsAISummary>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const prompt = `
你是中文美股财报研究助理。请基于输入的最近 5 年财报数据生成财报摘要。
严格要求：
- 不给买入、卖出、持有建议。
- 不给目标价。
- 不生成买入、卖出、持有或任何交易信号。
- 只分析增长趋势、盈利质量、现金流质量、债务风险、后续观察点。
- 输出必须是合法 JSON，不要 Markdown。
- disclaimer 必须精确为：${DISCLAIMER}

JSON schema:
{
  "growthTrend": "增长趋势分析",
  "profitQuality": "盈利质量分析",
  "cashFlowQuality": "现金流质量分析",
  "debtRisk": "债务风险分析",
  "watchPoints": ["后续观察点1", "后续观察点2", "后续观察点3"],
  "disclaimer": "${DISCLAIMER}"
}

company:
${JSON.stringify({ symbol, companyName })}

years:
${JSON.stringify(years)}

triggeredRules:
${JSON.stringify(risks)}
`;

    const result = await generateJsonWithOpenAI<Partial<EarningsAISummary>>(prompt);
    const summary = normalizeSummary(result, fallback);
    setCache(cacheKey, summary, AI_EARNINGS_TTL);

    return summary;
  } catch {
    return fallback;
  }
}

export async function getEarningsAnalysis(
  rawSymbol: string,
  forceRefresh = false,
): Promise<EarningsAnalysis> {
  const symbol = normalizeSymbol(rawSymbol || "NVDA");
  const companyName = findStockName(symbol);

  try {
    const [incomeStatements, balanceSheets, cashFlows] = await Promise.all([
      getIncomeStatement(symbol, forceRefresh, 5),
      getBalanceSheetStatements(symbol, forceRefresh, 5),
      getCashFlowStatements(symbol, forceRefresh, 5),
    ]);
    const liveYears = buildYearRows(incomeStatements, balanceSheets, cashFlows);
    const dataStatus = liveYears.length ? "live" : "fallback";
    const years = liveYears.length ? liveYears : buildMockStatements(symbol);
    const risks = evaluateEarningsRisks(years);
    const aiSummary = await generateEarningsSummary(
      symbol,
      companyName,
      years,
      risks,
      forceRefresh,
    );

    return {
      symbol,
      companyName,
      dataStatus,
      years,
      risks,
      aiSummary,
    };
  } catch {
    const years = buildMockStatements(symbol);
    const risks = evaluateEarningsRisks(years);
    const aiSummary = buildFallbackSummary(symbol, years, risks);

    return {
      symbol,
      companyName,
      dataStatus: "fallback",
      years,
      risks,
      aiSummary,
    };
  }
}
