"use client";

export const DEFAULT_WATCHLIST_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
];

const STORAGE_KEY = "ai-invest-dashboard.watchlist";

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const canUseStorage = (): boolean => typeof window !== "undefined";

const readStoredSymbols = (): string[] => {
  if (!canUseStorage()) {
    return DEFAULT_WATCHLIST_SYMBOLS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : DEFAULT_WATCHLIST_SYMBOLS;
    const symbols = parsed
      .map(normalizeSymbol)
      .filter((symbol, index, list) => symbol && list.indexOf(symbol) === index);

    return symbols.length ? symbols : DEFAULT_WATCHLIST_SYMBOLS;
  } catch {
    return DEFAULT_WATCHLIST_SYMBOLS;
  }
};

const writeSymbols = (symbols: string[]): string[] => {
  const normalized = symbols
    .map(normalizeSymbol)
    .filter((symbol, index, list) => symbol && list.indexOf(symbol) === index);

  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("watchlist:changed", { detail: normalized }));
  }

  return normalized;
};

export function getWatchlistSymbols(): string[] {
  return readStoredSymbols();
}

export function addWatchlistSymbol(symbol: string): string[] {
  const normalized = normalizeSymbol(symbol);

  if (!normalized) {
    return getWatchlistSymbols();
  }

  const current = getWatchlistSymbols();

  if (current.includes(normalized)) {
    return current;
  }

  return writeSymbols([...current, normalized]);
}

export function removeWatchlistSymbol(symbol: string): string[] {
  const normalized = normalizeSymbol(symbol);
  return writeSymbols(
    getWatchlistSymbols().filter((item) => item !== normalized),
  );
}

export function resetWatchlist(): string[] {
  return writeSymbols(DEFAULT_WATCHLIST_SYMBOLS);
}
