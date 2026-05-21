"use client";

import type { PortfolioPosition, PositionInput } from "@/lib/portfolio/types";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "ai-invest-dashboard.portfolio";

type PositionRow = {
  symbol: string;
  shares: number;
  avg_cost: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const canUseStorage = (): boolean => typeof window !== "undefined";

const readPositions = (): PortfolioPosition[] => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PortfolioPosition[]) : [];

    return parsed
      .map((position) => ({
        ...position,
        symbol: normalizeSymbol(position.symbol),
        shares: Number(position.shares),
        avgCost: Number(position.avgCost),
        currency: "USD" as const,
      }))
      .filter(
        (position) =>
          position.symbol &&
          Number.isFinite(position.shares) &&
          position.shares > 0 &&
          Number.isFinite(position.avgCost) &&
          position.avgCost >= 0,
      );
  } catch {
    return [];
  }
};

const writePositions = (positions: PortfolioPosition[]): PortfolioPosition[] => {
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    window.dispatchEvent(new CustomEvent("portfolio:changed", { detail: positions }));
  }

  return positions;
};

export function getPositions(): PortfolioPosition[] {
  return readPositions();
}

export function addOrUpdatePosition(
  position: PositionInput,
): PortfolioPosition[] {
  const symbol = normalizeSymbol(position.symbol);
  const shares = Number(position.shares);
  const avgCost = Number(position.avgCost);

  if (!symbol || !Number.isFinite(shares) || shares <= 0) {
    return getPositions();
  }

  if (!Number.isFinite(avgCost) || avgCost < 0) {
    return getPositions();
  }

  const now = new Date().toISOString();
  const current = getPositions();
  const existing = current.find((item) => item.symbol === symbol);
  const nextPosition: PortfolioPosition = {
    symbol,
    shares,
    avgCost,
    currency: "USD",
    note: position.note?.trim() ?? "",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return writePositions([
    ...current.filter((item) => item.symbol !== symbol),
    nextPosition,
  ]);
}

export function removePosition(symbol: string): PortfolioPosition[] {
  const normalized = normalizeSymbol(symbol);
  return writePositions(getPositions().filter((item) => item.symbol !== normalized));
}

export function resetPositions(): PortfolioPosition[] {
  return writePositions([]);
}

const dispatchPortfolioChange = (positions: PortfolioPosition[]) => {
  if (canUseStorage()) {
    window.dispatchEvent(new CustomEvent("portfolio:changed", { detail: positions }));
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

const mapRowToPosition = (row: PositionRow): PortfolioPosition => ({
  symbol: normalizeSymbol(row.symbol),
  shares: Number(row.shares),
  avgCost: Number(row.avg_cost),
  currency: "USD",
  note: row.note ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const readCloudPositions = async (): Promise<PortfolioPosition[] | null> => {
  const userId = await getCloudUserId();

  if (!userId) {
    return null;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("positions")
      .select("symbol, shares, avg_cost, note, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return null;
    }

    return ((data ?? []) as PositionRow[])
      .map(mapRowToPosition)
      .filter(
        (position) =>
          position.symbol &&
          Number.isFinite(position.shares) &&
          position.shares > 0 &&
          Number.isFinite(position.avgCost) &&
          position.avgCost >= 0,
      );
  } catch {
    return null;
  }
};

const writeCloudPositions = async (
  positions: PortfolioPosition[],
): Promise<PortfolioPosition[] | null> => {
  const userId = await getCloudUserId();

  if (!userId) {
    return null;
  }

  try {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("positions")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return null;
    }

    if (positions.length) {
      const { error: insertError } = await supabase.from("positions").insert(
        positions.map((position) => ({
          user_id: userId,
          symbol: position.symbol,
          shares: position.shares,
          avg_cost: position.avgCost,
          note: position.note,
          created_at: position.createdAt,
          updated_at: position.updatedAt,
        })),
      );

      if (insertError) {
        return null;
      }
    }

    dispatchPortfolioChange(positions);
    return positions;
  } catch {
    return null;
  }
};

export async function getPositionsSynced(): Promise<PortfolioPosition[]> {
  const cloudPositions = await readCloudPositions();
  return cloudPositions ?? getPositions();
}

export async function addOrUpdatePositionSynced(
  position: PositionInput,
): Promise<PortfolioPosition[]> {
  const symbol = normalizeSymbol(position.symbol);
  const shares = Number(position.shares);
  const avgCost = Number(position.avgCost);

  if (!symbol || !Number.isFinite(shares) || shares <= 0) {
    return getPositionsSynced();
  }

  if (!Number.isFinite(avgCost) || avgCost < 0) {
    return getPositionsSynced();
  }

  const now = new Date().toISOString();
  const current = await getPositionsSynced();
  const existing = current.find((item) => item.symbol === symbol);
  const nextPosition: PortfolioPosition = {
    symbol,
    shares,
    avgCost,
    currency: "USD",
    note: position.note?.trim() ?? "",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const nextPositions = [
    ...current.filter((item) => item.symbol !== symbol),
    nextPosition,
  ];
  const cloudPositions = await writeCloudPositions(nextPositions);

  if (cloudPositions) {
    return cloudPositions;
  }

  return addOrUpdatePosition(position);
}

export async function removePositionSynced(symbol: string): Promise<PortfolioPosition[]> {
  const normalized = normalizeSymbol(symbol);
  const current = await getPositionsSynced();
  const nextPositions = current.filter((item) => item.symbol !== normalized);
  const cloudPositions = await writeCloudPositions(nextPositions);

  if (cloudPositions) {
    return cloudPositions;
  }

  return removePosition(normalized);
}

export async function resetPositionsSynced(): Promise<PortfolioPosition[]> {
  const cloudPositions = await writeCloudPositions([]);

  if (cloudPositions) {
    return cloudPositions;
  }

  return resetPositions();
}
