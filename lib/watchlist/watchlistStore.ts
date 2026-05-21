"use client";

import { createClient } from "@/lib/supabase/client";

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

type WatchlistRow = {
  symbol: string;
};

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

const dispatchWatchlistChange = (symbols: string[]) => {
  if (canUseStorage()) {
    window.dispatchEvent(new CustomEvent("watchlist:changed", { detail: symbols }));
  }
};

const getCloudUserId = async (): Promise<string | null> => {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
};

const readCloudSymbols = async (): Promise<string[] | null> => {
  const userId = await getCloudUserId();

  if (!userId) {
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("watchlists")
      .select("symbol")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return null;
    }

    const symbols = ((data ?? []) as WatchlistRow[])
      .map((row) => normalizeSymbol(row.symbol))
      .filter((symbol, index, list) => symbol && list.indexOf(symbol) === index);

    if (symbols.length) {
      return symbols;
    }

    await writeCloudSymbols(DEFAULT_WATCHLIST_SYMBOLS);
    return DEFAULT_WATCHLIST_SYMBOLS;
  } catch {
    return null;
  }
};

const writeCloudSymbols = async (symbols: string[]): Promise<string[] | null> => {
  const userId = await getCloudUserId();

  if (!userId) {
    return null;
  }

  const normalized = symbols
    .map(normalizeSymbol)
    .filter((symbol, index, list) => symbol && list.indexOf(symbol) === index);

  try {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return null;
    }

    if (normalized.length) {
      const { error: insertError } = await supabase.from("watchlists").insert(
        normalized.map((symbol) => ({
          user_id: userId,
          symbol,
        })),
      );

      if (insertError) {
        return null;
      }
    }

    dispatchWatchlistChange(normalized);
    return normalized;
  } catch {
    return null;
  }
};

export async function getWatchlistSymbolsSynced(): Promise<string[]> {
  const cloudSymbols = await readCloudSymbols();
  return cloudSymbols ?? getWatchlistSymbols();
}

export async function addWatchlistSymbolSynced(symbol: string): Promise<string[]> {
  const normalized = normalizeSymbol(symbol);

  if (!normalized) {
    return getWatchlistSymbolsSynced();
  }

  const current = await getWatchlistSymbolsSynced();
  const next = current.includes(normalized) ? current : [...current, normalized];
  const cloudSymbols = await writeCloudSymbols(next);

  if (cloudSymbols) {
    return cloudSymbols;
  }

  return addWatchlistSymbol(normalized);
}

export async function removeWatchlistSymbolSynced(symbol: string): Promise<string[]> {
  const normalized = normalizeSymbol(symbol);
  const current = await getWatchlistSymbolsSynced();
  const next = current.filter((item) => item !== normalized);
  const cloudSymbols = await writeCloudSymbols(next);

  if (cloudSymbols) {
    return cloudSymbols;
  }

  return removeWatchlistSymbol(normalized);
}

export async function resetWatchlistSynced(): Promise<string[]> {
  const cloudSymbols = await writeCloudSymbols(DEFAULT_WATCHLIST_SYMBOLS);

  if (cloudSymbols) {
    return cloudSymbols;
  }

  return resetWatchlist();
}
