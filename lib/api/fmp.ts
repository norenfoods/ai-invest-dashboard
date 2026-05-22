import { getCache, setCache } from "@/lib/cache/simpleCache";
import { getFmpApiKey } from "@/lib/env";
import { getYahooQuote } from "@/lib/api/yahoo";
import { watchlistStocks } from "@/lib/mockData";

const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const QUOTE_TTL = 60_000;
const PROFILE_TTL = 24 * 60 * 60_000;
const INCOME_STATEMENT_TTL = 6 * 60 * 60_000;
const BALANCE_SHEET_TTL = 6 * 60 * 60_000;
const CASH_FLOW_TTL = 6 * 60 * 60_000;
const NEWS_TTL = 10 * 60_000;
const MARKET_INDEXES_TTL = 60_000;

export type FmpQuote = {
  symbol?: string;
  name?: string;
  price?: number | null;
  previousClose?: number | null;
  change?: number | null;
  changesPercentage?: number | null;
  marketCap?: number | null;
  pe?: number | null;
  psRatio?: number | null;
  dataStatus?: "live" | "fallback" | "missing";
  dataSource?: "fmp" | "yahoo" | "mock" | "none";
};

export type FmpCompanyProfile = {
  symbol?: string;
  companyName?: string;
  price?: number;
  marketCap?: number;
  mktCap?: number;
  sector?: string;
  industry?: string;
};

export type FmpIncomeStatement = {
  date?: string;
  calendarYear?: string;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  eps?: number;
  epsdiluted?: number;
};

export type FmpBalanceSheetStatement = {
  date?: string;
  calendarYear?: string;
  totalAssets?: number;
  totalLiabilities?: number;
  totalDebt?: number;
};

export type FmpCashFlowStatement = {
  date?: string;
  calendarYear?: string;
  operatingCashFlow?: number;
  capitalExpenditure?: number;
  freeCashFlow?: number;
};

export type FmpStockNews = {
  symbol?: string;
  publishedDate?: string;
  publisher?: string;
  title?: string;
  site?: string;
  url?: string;
  text?: string;
};

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const createQuoteLog = (
  symbol: string,
  requestUrl: string,
  responseStatus: number | "not_requested" | "error",
  emptyArray: boolean | "unknown",
  fallbackReason: string,
) => {
  console.info("[FMP quote]", {
    symbol,
    requestUrl,
    responseStatus,
    emptyArray,
    fallbackReason,
  });

  if (symbol.includes(".")) {
    console.info("[FMP quote] symbol contains dot; FMP may require a special exchange symbol format", {
      symbol,
    });
  }
};

const findMockQuote = (symbol: string): FmpQuote | null => {
  const mock = watchlistStocks.find(
    (stock) => stock.symbol.toUpperCase() === symbol.toUpperCase(),
  );

  if (!mock) {
    return null;
  }

  return {
    symbol: mock.symbol,
    name: mock.companyName,
    price: mock.price,
    change: mock.change,
    changesPercentage: mock.changePercent,
    marketCap: null,
    pe: null,
    psRatio: null,
    dataStatus: "fallback",
    dataSource: "mock",
  };
};

const createMissingQuote = (symbol: string): FmpQuote => ({
  symbol,
  name: symbol,
  price: null,
  change: null,
  changesPercentage: null,
  marketCap: null,
  pe: null,
  psRatio: null,
  dataStatus: "missing",
  dataSource: "none",
});

const hasValidPrice = (quote: Pick<FmpQuote, "price"> | undefined): boolean =>
  typeof quote?.price === "number" && Number.isFinite(quote.price);

const resolveFallbackQuote = async (
  symbol: string,
  forceRefresh: boolean,
): Promise<FmpQuote> => {
  const yahooQuote = await getYahooQuote(symbol, forceRefresh);

  if (yahooQuote) {
    return yahooQuote;
  }

  return findMockQuote(symbol) ?? createMissingQuote(symbol);
};

async function fmpFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  ttlMs: number,
  forceRefresh = false,
): Promise<T | null> {
  try {
    const apiKey = getFmpApiKey();

    if (!apiKey) {
      return null;
    }

    const url = new URL(`${FMP_BASE_URL}${path}`);
    const cacheKey = `fmp:${path}:${JSON.stringify(params)}`;

    if (!forceRefresh) {
      const cached = getCache<T>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as T;
    setCache(cacheKey, data, ttlMs);

    return data;
  } catch {
    return null;
  }
}

export async function getQuote(
  symbol: string,
  forceRefresh = false,
): Promise<FmpQuote | null> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const apiKey = getFmpApiKey();
  const url = new URL(`${FMP_BASE_URL}/quote`);
  const cacheKey = `fmp:/quote:${normalizedSymbol}`;

  url.searchParams.set("symbol", normalizedSymbol);

  try {
    if (!normalizedSymbol) {
      createQuoteLog(
        normalizedSymbol,
        url.toString(),
        "not_requested",
        "unknown",
        "empty_symbol",
      );
      return createMissingQuote(normalizedSymbol);
    }

    if (!forceRefresh) {
      const cached = getCache<FmpQuote>(cacheKey);

      if (cached) {
        createQuoteLog(
          normalizedSymbol,
          url.toString(),
          "not_requested",
          "unknown",
          "cache_hit",
        );
        return cached;
      }
    }

    if (!apiKey) {
      const fallback = await resolveFallbackQuote(normalizedSymbol, forceRefresh);
      createQuoteLog(
        normalizedSymbol,
        url.toString(),
        "not_requested",
        "unknown",
        `missing_api_key_${fallback.dataSource}_fallback`,
      );
      setCache(cacheKey, fallback, QUOTE_TTL);
      return fallback;
    }

    const requestUrl = url.toString();
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const fallback = await resolveFallbackQuote(normalizedSymbol, forceRefresh);
      createQuoteLog(
        normalizedSymbol,
        requestUrl,
        response.status,
        "unknown",
        `http_error_${fallback.dataSource}_fallback`,
      );
      setCache(cacheKey, fallback, QUOTE_TTL);
      return fallback;
    }

    const data = (await response.json()) as FmpQuote[];
    const emptyArray = data.length === 0;

    if (emptyArray) {
      const fallback = await resolveFallbackQuote(normalizedSymbol, forceRefresh);
      createQuoteLog(
        normalizedSymbol,
        requestUrl,
        response.status,
        true,
        `empty_quote_${fallback.dataSource}_fallback`,
      );
      setCache(cacheKey, fallback, QUOTE_TTL);
      return fallback;
    }

    if (!hasValidPrice(data[0])) {
      const fallback = await resolveFallbackQuote(normalizedSymbol, forceRefresh);
      createQuoteLog(
        normalizedSymbol,
        requestUrl,
        response.status,
        false,
        `missing_price_${fallback.dataSource}_fallback`,
      );
      setCache(cacheKey, fallback, QUOTE_TTL);
      return fallback;
    }

    const quote: FmpQuote = {
      ...data[0],
      symbol: data[0]?.symbol ?? normalizedSymbol,
      dataStatus: "live",
      dataSource: "fmp",
    };

    createQuoteLog(normalizedSymbol, requestUrl, response.status, false, "none");
    setCache(cacheKey, quote, QUOTE_TTL);
    return quote;
  } catch {
    const fallback = await resolveFallbackQuote(normalizedSymbol, forceRefresh);
    createQuoteLog(
      normalizedSymbol,
      url.toString(),
      "error",
      "unknown",
      `exception_${fallback.dataSource}_fallback`,
    );
    setCache(cacheKey, fallback, QUOTE_TTL);
    return fallback;
  }
}

export async function getCompanyProfile(
  symbol: string,
  forceRefresh = false,
): Promise<FmpCompanyProfile | null> {
  try {
    const data = await fmpFetch<FmpCompanyProfile[]>(
      "/profile",
      { symbol },
      PROFILE_TTL,
      forceRefresh,
    );
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getIncomeStatement(
  symbol: string,
  forceRefresh = false,
  limit = 4,
): Promise<FmpIncomeStatement[]> {
  try {
    const data = await fmpFetch<FmpIncomeStatement[]>(
      "/income-statement",
      {
        symbol,
        period: "annual",
        limit,
      },
      INCOME_STATEMENT_TTL,
      forceRefresh,
    );
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getBalanceSheetStatements(
  symbol: string,
  forceRefresh = false,
  limit = 5,
): Promise<FmpBalanceSheetStatement[]> {
  try {
    const data = await fmpFetch<FmpBalanceSheetStatement[]>(
      "/balance-sheet-statement",
      {
        symbol,
        period: "annual",
        limit,
      },
      BALANCE_SHEET_TTL,
      forceRefresh,
    );
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCashFlowStatements(
  symbol: string,
  forceRefresh = false,
  limit = 5,
): Promise<FmpCashFlowStatement[]> {
  try {
    const data = await fmpFetch<FmpCashFlowStatement[]>(
      "/cash-flow-statement",
      {
        symbol,
        period: "annual",
        limit,
      },
      CASH_FLOW_TTL,
      forceRefresh,
    );
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getMarketIndexes(forceRefresh = false): Promise<FmpQuote[]> {
  try {
    const cacheKey = "fmp:market-indexes:SPY,QQQ,DIA";

    if (!forceRefresh) {
      const cached = getCache<FmpQuote[]>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const quotes = await Promise.all(
      ["SPY", "QQQ", "DIA"].map((symbol) => getQuote(symbol, forceRefresh)),
    );
    const indexes = quotes.filter((quote): quote is FmpQuote => Boolean(quote));
    setCache(cacheKey, indexes, MARKET_INDEXES_TTL);

    return indexes;
  } catch {
    return [];
  }
}

export async function getStockNews(
  symbol: string,
  forceRefresh = false,
): Promise<FmpStockNews[]> {
  try {
    const data = await fmpFetch<FmpStockNews[]>(
      "/news/stock-latest",
      {
        symbols: symbol,
        limit: 5,
        page: 0,
      },
      NEWS_TTL,
      forceRefresh,
    );
    return data ?? [];
  } catch {
    return [];
  }
}
