"use client";

import type { PortfolioPosition, PositionInput } from "@/lib/portfolio/types";

const STORAGE_KEY = "ai-invest-dashboard.portfolio";

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
