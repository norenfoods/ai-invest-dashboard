import "server-only";

import type { FmpIncomeStatement } from "@/lib/api/fmp";
import { generateJsonWithOpenAI } from "@/lib/ai/openaiClient";
import { getCache, setCache } from "@/lib/cache/simpleCache";
import type { Stock, StockNews } from "@/lib/mockData";

const DISCLAIMER = "仅供研究参考，不构成投资建议。";
const AI_ANALYSIS_TTL = 30 * 60_000;

export type StockAIAnalysis = {
  summary: string;
  strengths: string[];
  risks: string[];
  watchPoints: string[];
  disclaimer: string;
};

const normalizeAnalysis = (
  result: Partial<StockAIAnalysis> | null,
  fallback: StockAIAnalysis,
): StockAIAnalysis => {
  const summary = result?.summary || fallback.summary;

  return {
    summary: summary.includes(DISCLAIMER)
      ? summary
      : `${summary}${summary.endsWith("。") ? "" : "。"}${DISCLAIMER}`,
    strengths: result?.strengths?.length ? result.strengths : fallback.strengths,
    risks: result?.risks?.length ? result.risks : fallback.risks,
    watchPoints: result?.watchPoints?.length
      ? result.watchPoints
      : fallback.watchPoints,
    disclaimer: DISCLAIMER,
  };
};

const buildMockAnalysis = (stock: Stock): StockAIAnalysis => ({
  summary: `${stock.companyName}（${stock.symbol}）当前处于${stock.sector}板块，价格变动为${stock.changePercent.toFixed(2)}%。从 mock 数据看，营收增长率为${stock.revenueGrowth.toFixed(1)}%，毛利率为${stock.grossMargin.toFixed(1)}%，适合从增长质量、利润率和估值消化角度继续研究。${DISCLAIMER}`,
  strengths: [
    `${stock.industry}方向具备明确研究主线。`,
    `毛利率为${stock.grossMargin.toFixed(1)}%，可用于观察商业模式质量。`,
    `AI 摘要显示核心业务仍有可跟踪变量。`,
  ],
  risks: [
    `当前风险等级为${stock.riskLevel}，需要控制结论外推。`,
    `PE 为${stock.peRatio}，估值变化可能放大波动。`,
    `新闻与财报数据需要持续更新验证。`,
  ],
  watchPoints: [
    `下次财报日：${stock.nextEarningsDate}。`,
    "后续收入增速和毛利率是否保持一致方向。",
    "行业新闻是否改变市场对基本面的预期。",
  ],
  disclaimer: DISCLAIMER,
});

export async function analyzeStock(
  stock: Stock,
  incomeStatement: FmpIncomeStatement[],
  news: StockNews[],
  forceRefresh = false,
): Promise<StockAIAnalysis> {
  const fallback = buildMockAnalysis(stock);
  const cacheKey = `ai:stock:${stock.symbol}:${JSON.stringify({
    price: stock.price,
    changePercent: stock.changePercent,
    peRatio: stock.peRatio,
    psRatio: stock.psRatio,
    revenueGrowth: stock.revenueGrowth,
    grossMargin: stock.grossMargin,
    netMargin: stock.netMargin,
    news: news.map((item) => item.id),
  })}`;

  try {
    if (!forceRefresh) {
      const cached = getCache<StockAIAnalysis>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const prompt = `
你是中文美股研究助理。请基于输入数据生成研究摘要和风险提示。
严格要求：
- 不给买入、卖出、持有建议。
- 不给目标价。
- 不生成交易信号。
- 只做研究摘要、优势、风险、后续观察点。
- 输出必须是合法 JSON，不要 Markdown。
- disclaimer 必须精确为：${DISCLAIMER}

JSON schema:
{
  "summary": "中文个股摘要，必须包含 '${DISCLAIMER}'",
  "strengths": ["优势1", "优势2", "优势3"],
  "risks": ["风险1", "风险2", "风险3"],
  "watchPoints": ["观察点1", "观察点2", "观察点3"],
  "disclaimer": "${DISCLAIMER}"
}

stock:
${JSON.stringify(stock)}

incomeStatement:
${JSON.stringify(incomeStatement.slice(0, 4))}

news:
${JSON.stringify(news.slice(0, 5))}
`;

    const result = await generateJsonWithOpenAI<Partial<StockAIAnalysis>>(prompt);
    const analysis = normalizeAnalysis(result, fallback);
    setCache(cacheKey, analysis, AI_ANALYSIS_TTL);

    return analysis;
  } catch {
    return fallback;
  }
}
