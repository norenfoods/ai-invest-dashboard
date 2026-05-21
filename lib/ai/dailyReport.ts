import "server-only";

import { generateJsonWithOpenAI } from "@/lib/ai/openaiClient";
import { getCache, setCache } from "@/lib/cache/simpleCache";
import type { Alert, IndexQuote, Stock } from "@/lib/mockData";

const DISCLAIMER = "仅供研究参考，不构成投资建议。";
const AI_DAILY_REPORT_TTL = 30 * 60_000;

export type AIDailyReport = {
  marketOverview: string;
  watchlistMoves: string[];
  majorRisks: string[];
  tomorrowFocus: string[];
  disclaimer: string;
};

const normalizeReport = (
  result: Partial<AIDailyReport> | null,
  fallback: AIDailyReport,
): AIDailyReport => {
  const marketOverview = result?.marketOverview || fallback.marketOverview;

  return {
    marketOverview: marketOverview.includes(DISCLAIMER)
      ? marketOverview
      : `${marketOverview}${marketOverview.endsWith("。") ? "" : "。"}${DISCLAIMER}`,
    watchlistMoves: result?.watchlistMoves?.length
      ? result.watchlistMoves
      : fallback.watchlistMoves,
    majorRisks: result?.majorRisks?.length
      ? result.majorRisks
      : fallback.majorRisks,
    tomorrowFocus: result?.tomorrowFocus?.length
      ? result.tomorrowFocus
      : fallback.tomorrowFocus,
    disclaimer: DISCLAIMER,
  };
};

const buildMockDailyReport = (
  indexes: IndexQuote[],
  stocks: Stock[],
  alerts: Alert[],
): AIDailyReport => {
  const leaders = [...stocks]
    .sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity))
    .slice(0, 3);
  const laggards = [...stocks]
    .sort((a, b) => (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity))
    .slice(0, 2);

  return {
    marketOverview: `今日市场以 ${indexes.map((item) => `${item.symbol} ${item.changePercent.toFixed(2)}%`).join("、")} 为主要观察对象。自选股表现分化，科技权重仍是组合波动来源。${DISCLAIMER}`,
    watchlistMoves: leaders.map(
      (stock) =>
        `${stock.symbol} 涨跌幅 ${stock.changePercent?.toFixed(2) ?? "—"}%，重点观察 ${stock.sector} 相关预期变化。`,
    ),
    majorRisks: [
      ...alerts.slice(0, 2).map((alert) => `${alert.title}：${alert.description}`),
      ...laggards.map(
        (stock) =>
          `${stock.symbol} 当前表现偏弱，需观察基本面或新闻是否出现新增压力。`,
      ),
    ],
    tomorrowFocus: [
      "关注自选股新闻是否改变收入增长和利润率预期。",
      "关注指数代理 SPY、QQQ、DIA 的分化是否扩大。",
      "关注高风险等级标的是否出现进一步波动。",
    ],
    disclaimer: DISCLAIMER,
  };
};

export async function generateDailyReport(
  indexes: IndexQuote[],
  stocks: Stock[],
  alerts: Alert[],
  forceRefresh = false,
): Promise<AIDailyReport> {
  const fallback = buildMockDailyReport(indexes, stocks, alerts);
  const cacheKey = `ai:daily:${JSON.stringify({
    indexes: indexes.map((item) => [item.symbol, item.changePercent]),
    stocks: stocks.map((item) => [item.symbol, item.changePercent, item.riskLevel]),
    alerts: alerts.map((item) => item.id),
  })}`;

  try {
    if (!forceRefresh) {
      const cached = getCache<AIDailyReport>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const prompt = `
你是中文美股研究助理。请生成一份 AI Daily Report。
严格要求：
- 不给买入、卖出、持有建议。
- 不给目标价。
- 不生成交易信号。
- 只做市场概览、异动、风险、明日关注事项。
- 输出必须是合法 JSON，不要 Markdown。
- disclaimer 必须精确为：${DISCLAIMER}

JSON schema:
{
  "marketOverview": "今日市场概览，必须包含 '${DISCLAIMER}'",
  "watchlistMoves": ["自选股异动1", "自选股异动2", "自选股异动3"],
  "majorRisks": ["主要风险1", "主要风险2", "主要风险3"],
  "tomorrowFocus": ["明日关注事项1", "明日关注事项2", "明日关注事项3"],
  "disclaimer": "${DISCLAIMER}"
}

indexes:
${JSON.stringify(indexes)}

stocks:
${JSON.stringify(stocks)}

alerts:
${JSON.stringify(alerts)}
`;

    const result = await generateJsonWithOpenAI<Partial<AIDailyReport>>(prompt);
    const report = normalizeReport(result, fallback);
    setCache(cacheKey, report, AI_DAILY_REPORT_TTL);

    return report;
  } catch {
    return fallback;
  }
}
