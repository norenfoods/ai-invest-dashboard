import type { PortfolioPosition } from "@/lib/portfolio/types";
import {
  evaluatePortfolioAlerts,
  evaluateStockAlerts,
  type StockAlert,
} from "@/lib/rules/alertRules";
import {
  getStockBySymbol,
  getStocksBySymbols,
  getWatchlistStocks,
} from "@/lib/services/stockService";

type AlertServiceOptions = {
  forceRefresh?: boolean;
};

export async function getAlertsForWatchlist(): Promise<StockAlert[]> {
  try {
    const stocks = await getWatchlistStocks();
    return stocks.flatMap((stock) => evaluateStockAlerts(stock));
  } catch {
    return [];
  }
}

export async function getAlertsForStock(symbol: string): Promise<StockAlert[]> {
  try {
    const stock = await getStockBySymbol(symbol);

    if (!stock) {
      return [];
    }

    return evaluateStockAlerts(stock);
  } catch {
    return [];
  }
}

export async function getAlertsForSymbols(symbols: string[]): Promise<StockAlert[]> {
  try {
    const stocks = await getStocksBySymbols(symbols);
    return stocks.flatMap((stock) => evaluateStockAlerts(stock));
  } catch {
    return [];
  }
}

export async function getAlertsForSymbolsAndPortfolio(
  symbols: string[],
  positions: PortfolioPosition[],
  options: AlertServiceOptions = {},
): Promise<StockAlert[]> {
  try {
    const portfolioSymbols = positions.map((position) => position.symbol);
    const mergedSymbols = [...symbols, ...portfolioSymbols].filter(
      (symbol, index, list) => symbol && list.indexOf(symbol) === index,
    );
    const stocks = await getStocksBySymbols(mergedSymbols, options);
    const stockAlerts = stocks.flatMap((stock) => evaluateStockAlerts(stock));
    const portfolioAlerts = evaluatePortfolioAlerts(positions, stocks);

    return [...portfolioAlerts, ...stockAlerts];
  } catch {
    return [];
  }
}
