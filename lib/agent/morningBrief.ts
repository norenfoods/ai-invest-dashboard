import "server-only";

import { getQuote, type FmpQuote } from "@/lib/api/fmp";
import { generateJsonWithOpenAI } from "@/lib/ai/openaiClient";
import { getCache, setCache } from "@/lib/cache/simpleCache";
import type { Stock } from "@/lib/mockData";
import type { PortfolioPosition } from "@/lib/portfolio/types";
import { getAlertsForSymbolsAndPortfolio } from "@/lib/services/alertService";
import { getStocksBySymbols, watchlistSymbols } from "@/lib/services/stockService";

const DISCLAIMER = "仅供研究参考，不构成投资建议。";
const MORNING_BRIEF_TTL = 30 * 60_000;

type BriefQuoteGroup = "index" | "macro";

export type MorningBriefQuote = {
  symbol: string;
  label: string;
  value: string;
  changePercent: number | null;
  dataStatus: "live" | "fallback" | "missing";
  group: BriefQuoteGroup;
};

export type MorningBrief = {
  oneLineSummary: string;
  indexes: MorningBriefQuote[];
  macro: MorningBriefQuote[];
  aiThemeStatus: string;
  semiconductorStatus: string;
  softwareStatus: string;
  watchlistMoves: string[];
  earningsReminders: string[];
  riskNotes: string[];
  tomorrowFocus: string[];
  disclaimer: string;
  generatedAt: string;
};

type GenerateMorningBriefOptions = {
  symbols?: string[];
  positions?: PortfolioPosition[];
  forceRefresh?: boolean;
};

const indexSymbols = [
  { symbol: "SPY", label: "SPY 标普500 ETF" },
  { symbol: "QQQ", label: "QQQ 纳斯达克100 ETF" },
  { symbol: "DIA", label: "DIA 道琼斯 ETF" },
  { symbol: "IWM", label: "IWM 罗素2000 ETF" },
  { symbol: "SOXX", label: "SOXX 半导体 ETF" },
  { symbol: "^VIX", label: "VIX 波动率" },
];

const macroSymbols = [
  { symbol: "^TNX", label: "10Y Treasury" },
  { symbol: "DX-Y.NYB", label: "DXY 美元指数" },
  { symbol: "CL=F", label: "Oil WTI 原油" },
  { symbol: "BTC-USD", label: "BTC 比特币" },
];

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const normalizeSymbols = (symbols?: string[]): string[] => {
  const normalized = (symbols?.length ? symbols : watchlistSymbols)
    .map(normalizeSymbol)
    .filter((symbol, index, list) => symbol && list.indexOf(symbol) === index);

  return normalized.length ? normalized : watchlistSymbols;
};

const formatNumber = (value?: number | null): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "暂无数据";
  }

  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

const formatPercent = (value?: number | null): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "—"
    : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

const mapQuote = (
  source: { symbol: string; label: string },
  quote: FmpQuote | null,
  group: BriefQuoteGroup,
): MorningBriefQuote => ({
  symbol: source.symbol,
  label: source.label,
  value: formatNumber(quote?.price),
  changePercent: quote?.changesPercentage ?? null,
  dataStatus: quote?.dataStatus ?? "missing",
  group,
});

const buildQuoteRows = async (
  sources: Array<{ symbol: string; label: string }>,
  group: BriefQuoteGroup,
  forceRefresh: boolean,
): Promise<MorningBriefQuote[]> => {
  const quotes = await Promise.all(
    sources.map((item) => getQuote(item.symbol, forceRefresh)),
  );

  return sources.map((item, index) => mapQuote(item, quotes[index], group));
};

const topMovers = (stocks: Stock[]): Stock[] =>
  [...stocks]
    .filter((stock) => stock.changePercent !== null)
    .sort(
      (a, b) =>
        Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0),
    )
    .slice(0, 5);

const daysUntil = (date: string): number | null => {
  const target = new Date(date);

  if (!date || date === "N/A" || Number.isNaN(target.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};

const buildEarningsReminders = (stocks: Stock[]): string[] => {
  const reminders = stocks
    .map((stock) => ({ stock, days: daysUntil(stock.nextEarningsDate) }))
    .filter((item) => item.days !== null && item.days >= 0 && item.days <= 30)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .slice(0, 5)
    .map(
      ({ stock, days }) =>
        `${stock.symbol} · ${stock.companyName}：预计 ${stock.nextEarningsDate} 财报，距今约 ${days} 天，需关注波动风险。`,
    );

  return reminders.length
    ? reminders
    : ["未来 30 天内自选股暂无明确财报日期，继续关注公司公告与日历更新。"];
};

const fallbackBrief = (
  indexes: MorningBriefQuote[],
  macro: MorningBriefQuote[],
  stocks: Stock[],
  riskNotes: string[],
): MorningBrief => {
  const movers = topMovers(stocks);
  const qqq = indexes.find((item) => item.symbol === "QQQ");
  const soxx = indexes.find((item) => item.symbol === "SOXX");
  const vix = indexes.find((item) => item.symbol === "^VIX");
  const aiNames = stocks
    .filter((stock) =>
      ["NVDA", "MSFT", "GOOGL", "META", "AMZN"].includes(stock.symbol),
    )
    .slice(0, 4)
    .map((stock) => `${stock.symbol} ${formatPercent(stock.changePercent)}`);

  return {
    oneLineSummary: `市场主线聚焦科技权重与 AI 链条，QQQ ${formatPercent(qqq?.changePercent)}，SOXX ${formatPercent(soxx?.changePercent)}，波动率 ${formatPercent(vix?.changePercent)}。${DISCLAIMER}`,
    indexes,
    macro,
    aiThemeStatus: aiNames.length
      ? `AI 主线跟踪 ${aiNames.join("、")}；重点观察算力需求、云资本开支和估值消化速度。`
      : "AI 主线数据不足，重点观察科技权重和半导体 ETF 的相对强弱。",
    semiconductorStatus: `半导体以 SOXX 为代理，当前表现 ${formatPercent(soxx?.changePercent)}，需要结合 NVDA、设备链与存储链消息验证持续性。`,
    softwareStatus: `软件股重点观察 MSFT、GOOGL、META 等平台型公司，企业 IT 预算和 AI 变现仍是主要变量。`,
    watchlistMoves: movers.length
      ? movers.map(
          (stock) =>
            `${stock.symbol} · ${stock.companyName} 涨跌幅 ${formatPercent(stock.changePercent)}，数据状态为 ${stock.dataStatus}。`,
        )
      : ["自选股暂无有效涨跌幅数据，需等待行情源恢复或补充。"],
    earningsReminders: buildEarningsReminders(stocks),
    riskNotes: riskNotes.length
      ? riskNotes.slice(0, 6)
      : ["当前规则引擎未触发高优先级风险，但仍需关注宏观利率、财报窗口和高估值波动。"],
    tomorrowFocus: [
      "观察 SPY、QQQ、SOXX 是否继续同向，判断科技权重是否仍主导风险偏好。",
      "观察 10Y Treasury、DXY、Oil、BTC 是否放大跨资产波动。",
      "跟踪自选股新闻与财报日历，重点关注高估值和高波动标的。",
    ],
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
};

const normalizeBrief = (
  result: Partial<MorningBrief> | null,
  fallback: MorningBrief,
): MorningBrief => {
  const oneLineSummary = result?.oneLineSummary || fallback.oneLineSummary;

  return {
    oneLineSummary: oneLineSummary.includes(DISCLAIMER)
      ? oneLineSummary
      : `${oneLineSummary}${oneLineSummary.endsWith("。") ? "" : "。"}${DISCLAIMER}`,
    indexes: fallback.indexes,
    macro: fallback.macro,
    aiThemeStatus: result?.aiThemeStatus || fallback.aiThemeStatus,
    semiconductorStatus:
      result?.semiconductorStatus || fallback.semiconductorStatus,
    softwareStatus: result?.softwareStatus || fallback.softwareStatus,
    watchlistMoves: result?.watchlistMoves?.length
      ? result.watchlistMoves
      : fallback.watchlistMoves,
    earningsReminders: result?.earningsReminders?.length
      ? result.earningsReminders
      : fallback.earningsReminders,
    riskNotes: result?.riskNotes?.length ? result.riskNotes : fallback.riskNotes,
    tomorrowFocus: result?.tomorrowFocus?.length
      ? result.tomorrowFocus
      : fallback.tomorrowFocus,
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
};

export async function generateMorningBrief(
  options: GenerateMorningBriefOptions = {},
): Promise<MorningBrief> {
  const symbols = normalizeSymbols(options.symbols);
  const positions = options.positions ?? [];
  const cacheKey = `ai:morning-brief:${JSON.stringify({
    symbols,
    positions: positions.map((item) => [item.symbol, item.shares, item.avgCost]),
  })}`;

  if (!options.forceRefresh) {
    const cached = getCache<MorningBrief>(cacheKey);

    if (cached) {
      return cached;
    }
  }

  const portfolioSymbols = positions.map((position) => position.symbol);
  const targetSymbols = [...symbols, ...portfolioSymbols].filter(
    (symbol, index, list) => symbol && list.indexOf(symbol) === index,
  );
  const [indexes, macro, stocks, alerts] = await Promise.all([
    buildQuoteRows(indexSymbols, "index", Boolean(options.forceRefresh)),
    buildQuoteRows(macroSymbols, "macro", Boolean(options.forceRefresh)),
    getStocksBySymbols(targetSymbols, { forceRefresh: options.forceRefresh }),
    getAlertsForSymbolsAndPortfolio(targetSymbols, positions, {
      forceRefresh: options.forceRefresh,
    }),
  ]);
  const riskNotes = alerts.map(
    (alert) => `${alert.symbol} · ${alert.companyName}：${alert.message}`,
  );
  const fallback = fallbackBrief(indexes, macro, stocks, riskNotes);

  try {
    const prompt = `
你是中文美股研究终端的 AI Morning Brief 生成器。
任务：生成一份简洁、专业、高信噪比的日度美股市场简报。

硬性限制：
- 只做研究摘要、观察点和风险提示。
- 禁止买入、卖出、持有建议。
- 禁止目标价。
- 禁止自动交易信号。
- 输出必须是合法 JSON，不要 Markdown。
- disclaimer 必须精确为：${DISCLAIMER}

JSON schema:
{
  "oneLineSummary": "今日一句话总结，必须包含 '${DISCLAIMER}'",
  "aiThemeStatus": "AI 主线状态",
  "semiconductorStatus": "半导体状态",
  "softwareStatus": "软件股状态",
  "watchlistMoves": ["自选股异动"],
  "earningsReminders": ["财报提醒"],
  "riskNotes": ["风险提示"],
  "tomorrowFocus": ["明日观察重点"],
  "disclaimer": "${DISCLAIMER}"
}

指数表现:
${JSON.stringify(indexes)}

利率与宏观:
${JSON.stringify(macro)}

watchlist 和 portfolio 股票:
${JSON.stringify(stocks)}

规则预警:
${JSON.stringify(alerts)}
`;

    const result = await generateJsonWithOpenAI<Partial<MorningBrief>>(prompt);
    const brief = normalizeBrief(result, fallback);
    setCache(cacheKey, brief, MORNING_BRIEF_TTL);

    return brief;
  } catch {
    setCache(cacheKey, fallback, MORNING_BRIEF_TTL);
    return fallback;
  }
}
