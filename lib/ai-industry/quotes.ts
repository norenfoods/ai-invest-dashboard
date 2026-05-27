import "server-only";

import { getQuote } from "@/lib/api/fmp";
import type { AiCompanyNode } from "@/lib/ai-industry/types";

export type AiIndustryQuoteStatus =
  | "realtime"
  | "fallback"
  | "missing"
  | "unsupported";

export type AiIndustryQuote = {
  displaySymbol: string;
  providerSymbol: string | null;
  price: number | null;
  changePercent: number | null;
  status: AiIndustryQuoteStatus;
  source: string;
};

const supportedExchangeNotes: Record<string, string> = {
  NASDAQ: "US equities supported as bare tickers by FMP/Yahoo.",
  NYSE: "US equities supported as bare tickers by FMP/Yahoo.",
  "SSE STAR": "A-share STAR Market supported through Yahoo .SS suffix fallback.",
  SSE: "A-share Shanghai supported through Yahoo .SS suffix fallback.",
  SZSE: "A-share Shenzhen supported through Yahoo .SZ suffix fallback.",
  HKEX: "Hong Kong equities supported through Yahoo zero-padded .HK suffix fallback.",
  TSE: "Japan equities supported through Yahoo .T suffix fallback.",
  KRX: "Korea equities supported through Yahoo .KS suffix fallback.",
  TWSE: "Taiwan equities supported through Yahoo .TW suffix fallback.",
  AMS: "Amsterdam listings supported through Yahoo .AS suffix fallback.",
};

const normalizeTicker = (ticker: string): string =>
  ticker.trim().replace(/\s+/g, "").toUpperCase();

const stripLeadingZeros = (ticker: string): string => {
  const stripped = ticker.replace(/^0+/, "");
  return stripped || ticker;
};

export function normalizeTickerForExchange(
  ticker: string,
  exchange: string,
): string | null {
  const normalizedTicker = normalizeTicker(ticker);
  const normalizedExchange = exchange.trim().toUpperCase();

  if (!normalizedTicker) {
    return null;
  }

  if (["NASDAQ", "NYSE"].includes(normalizedExchange)) {
    return normalizedTicker;
  }

  if (normalizedExchange === "SSE" || normalizedExchange === "SSE STAR") {
    return `${normalizedTicker}.SS`;
  }

  if (normalizedExchange === "SZSE") {
    return `${normalizedTicker}.SZ`;
  }

  if (normalizedExchange === "HKEX") {
    return `${normalizedTicker.padStart(4, "0")}.HK`;
  }

  if (normalizedExchange === "TSE") {
    return `${stripLeadingZeros(normalizedTicker)}.T`;
  }

  if (normalizedExchange === "KRX") {
    return `${normalizedTicker}.KS`;
  }

  if (normalizedExchange === "TWSE") {
    return `${normalizedTicker}.TW`;
  }

  if (normalizedExchange === "AMS") {
    return `${normalizedTicker}.AS`;
  }

  return null;
}

const hasUsablePrice = (price: number | null | undefined): price is number =>
  typeof price === "number" && Number.isFinite(price) && price > 0;

const isRealQuoteSource = (source: string | undefined): boolean =>
  source === "fmp" || source === "yahoo";

export async function getAiIndustryQuote(
  company: Pick<AiCompanyNode, "ticker" | "exchange">,
): Promise<AiIndustryQuote> {
  const providerSymbol = normalizeTickerForExchange(
    company.ticker,
    company.exchange,
  );

  if (!providerSymbol) {
    return {
      displaySymbol: `${company.ticker}.${company.exchange}`,
      providerSymbol: null,
      price: null,
      changePercent: null,
      status: "unsupported",
      source: "unsupported",
    };
  }

  const quote = await getQuote(providerSymbol);

  if (!hasUsablePrice(quote?.price) || !isRealQuoteSource(quote?.dataSource)) {
    return {
      displaySymbol: `${company.ticker}.${company.exchange}`,
      providerSymbol,
      price: null,
      changePercent: null,
      status: "missing",
      source: quote?.dataSource ?? "none",
    };
  }

  return {
    displaySymbol: `${company.ticker}.${company.exchange}`,
    providerSymbol,
    price: quote.price,
    changePercent: quote.changesPercentage ?? null,
    status: quote.dataStatus === "live" ? "realtime" : "fallback",
    source: quote.dataSource ?? "unknown",
  };
}

export async function getAiIndustryQuotes(
  companies: Array<Pick<AiCompanyNode, "id" | "ticker" | "exchange">>,
): Promise<Record<string, AiIndustryQuote>> {
  const entries = await Promise.all(
    companies.map(async (company) => [
      company.id,
      await getAiIndustryQuote(company),
    ] as const),
  );

  return Object.fromEntries(entries);
}

export function getExchangeSupportSummary(): Array<{
  exchange: string;
  note: string;
}> {
  return Object.entries(supportedExchangeNotes).map(([exchange, note]) => ({
    exchange,
    note,
  }));
}
