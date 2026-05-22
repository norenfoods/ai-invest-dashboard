import { getCache, setCache } from "@/lib/cache/simpleCache";

const YAHOO_QUOTE_TTL = 60_000;

export type YahooQuote = {
  symbol: string;
  name?: string;
  price: number | null;
  change: number | null;
  changesPercentage: number | null;
  marketCap: number | null;
  pe: number | null;
  psRatio: number | null;
  dataStatus: "fallback";
  dataSource: "yahoo";
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
      };
    }>;
  };
};

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const isValidNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export async function getYahooQuote(
  symbol: string,
  forceRefresh = false,
): Promise<YahooQuote | null> {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (!normalizedSymbol) {
    return null;
  }

  const cacheKey = `yahoo:quote:${normalizedSymbol}`;

  try {
    if (!forceRefresh) {
      const cached = getCache<YahooQuote>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const url = new URL(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}`,
    );
    url.searchParams.set("interval", "1d");
    url.searchParams.set("range", "1d");

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as YahooChartResponse;
    const meta = data.chart?.result?.[0]?.meta;
    const price = isValidNumber(meta?.regularMarketPrice)
      ? meta.regularMarketPrice
      : null;
    const previousClose = isValidNumber(meta?.chartPreviousClose)
      ? meta.chartPreviousClose
      : null;

    if (price === null) {
      return null;
    }

    const change =
      previousClose && previousClose > 0 ? Number((price - previousClose).toFixed(2)) : null;
    const changesPercentage =
      previousClose && previousClose > 0
        ? Number((((price - previousClose) / previousClose) * 100).toFixed(2))
        : null;
    const quote: YahooQuote = {
      symbol: meta?.symbol ? normalizeSymbol(meta.symbol) : normalizedSymbol,
      name: normalizedSymbol,
      price,
      change,
      changesPercentage,
      marketCap: null,
      pe: null,
      psRatio: null,
      dataStatus: "fallback",
      dataSource: "yahoo",
    };

    setCache(cacheKey, quote, YAHOO_QUOTE_TTL);
    return quote;
  } catch {
    return null;
  }
}
