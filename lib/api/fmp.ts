import { getCache, setCache } from "@/lib/cache/simpleCache";
import { getFmpApiKey } from "@/lib/env";

const FMP_BASE_URL = "https://financialmodelingprep.com/stable";
const QUOTE_TTL = 60_000;
const PROFILE_TTL = 24 * 60 * 60_000;
const INCOME_STATEMENT_TTL = 6 * 60 * 60_000;
const NEWS_TTL = 10 * 60_000;
const MARKET_INDEXES_TTL = 60_000;

export type FmpQuote = {
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
  marketCap?: number;
  pe?: number;
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
  revenue?: number;
  grossProfit?: number;
  netIncome?: number;
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
  try {
    const data = await fmpFetch<FmpQuote[]>(
      "/quote",
      { symbol },
      QUOTE_TTL,
      forceRefresh,
    );
    return data?.[0] ?? null;
  } catch {
    return null;
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
): Promise<FmpIncomeStatement[]> {
  try {
    const data = await fmpFetch<FmpIncomeStatement[]>(
      "/income-statement",
      {
        symbol,
        limit: 4,
      },
      INCOME_STATEMENT_TTL,
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
