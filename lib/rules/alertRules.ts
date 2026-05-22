import type { Stock } from "@/lib/mockData";
import type { PortfolioPosition } from "@/lib/portfolio/types";

export type AlertRuleType =
  | "highValuation"
  | "negativeGrowth"
  | "lowMargin"
  | "earningsSoon"
  | "highDailyMove"
  | "singlePositionTooHigh"
  | "portfolioLoss"
  | "highRiskHolding";

export type AlertLevel = "low" | "medium" | "high";

export type StockAlert = {
  id: string;
  symbol: string;
  companyName: string;
  type: AlertRuleType;
  level: AlertLevel;
  message: string;
  createdAt: string;
};

const daysUntil = (dateText: string, now: Date): number | null => {
  const target = new Date(`${dateText}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};

const createAlert = (
  stock: Pick<Stock, "symbol" | "companyName">,
  type: AlertRuleType,
  level: AlertLevel,
  message: string,
  createdAt: string,
): StockAlert => ({
  id: `${stock.symbol}-${type}`,
  symbol: stock.symbol,
  companyName: stock.companyName,
  type,
  level,
  message,
  createdAt,
});

export function evaluateStockAlerts(stock: Stock, now = new Date()): StockAlert[] {
  const createdAt = now.toISOString();
  const alerts: StockAlert[] = [];

  if ((stock.peRatio ?? 0) > 60 || (stock.psRatio ?? 0) > 20) {
    alerts.push(
      createAlert(
        stock,
        "highValuation",
        "high",
        "估值处于偏高区间，需关注业绩增长是否匹配估值。",
        createdAt,
      ),
    );
  }

  if ((stock.revenueGrowth ?? 0) < 0) {
    alerts.push(
      createAlert(
        stock,
        "negativeGrowth",
        "high",
        "营收增长为负，需关注基本面是否恶化。",
        createdAt,
      ),
    );
  }

  if ((stock.grossMargin ?? 100) < 30 || (stock.netMargin ?? 100) < 10) {
    alerts.push(
      createAlert(
        stock,
        "lowMargin",
        "medium",
        "利润率偏低，需关注盈利质量。",
        createdAt,
      ),
    );
  }

  const earningsDays = daysUntil(stock.nextEarningsDate, now);

  if (earningsDays !== null && earningsDays >= 0 && earningsDays <= 14) {
    alerts.push(
      createAlert(
        stock,
        "earningsSoon",
        "medium",
        "财报临近，需关注波动风险。",
        createdAt,
      ),
    );
  }

  if (Math.abs(stock.changePercent ?? 0) >= 5) {
    alerts.push(
      createAlert(
        stock,
        "highDailyMove",
        "medium",
        "日内波动较大，需关注消息面或市场情绪变化。",
        createdAt,
      ),
    );
  }

  return alerts;
}

export function evaluatePortfolioAlerts(
  positions: PortfolioPosition[],
  stocks: Stock[],
  now = new Date(),
): StockAlert[] {
  const createdAt = now.toISOString();
  const alerts: StockAlert[] = [];
  const stockMap = new Map(stocks.map((stock) => [stock.symbol, stock]));
  const positionRows = positions
    .map((position) => {
      const stock = stockMap.get(position.symbol);
      const price = stock?.price ?? null;
      const marketValue = price === null ? null : position.shares * price;
      const cost = position.shares * position.avgCost;

      return {
        position,
        stock,
        marketValue,
        cost,
      };
    })
    .filter((row) => row.marketValue !== null || row.cost > 0);
  const pricedRows = positionRows.filter((row) => row.marketValue !== null);
  const allPricesAvailable =
    positionRows.length > 0 &&
    positionRows.every((row) => row.marketValue !== null);

  const totalMarketValue = pricedRows.reduce(
    (sum, row) => sum + (row.marketValue ?? 0),
    0,
  );
  const totalCost = pricedRows.reduce((sum, row) => sum + row.cost, 0);

  if (totalMarketValue > 0) {
    for (const row of pricedRows) {
      const weight = (row.marketValue ?? 0) / totalMarketValue;

      if (weight > 0.3) {
        const stock = row.stock ?? {
          symbol: row.position.symbol,
          companyName: row.position.symbol,
        };

        alerts.push(
          createAlert(
            stock,
            "singlePositionTooHigh",
            "medium",
            "单只股票仓位超过 30%，需关注集中度风险。",
            createdAt,
          ),
        );
      }
    }
  }

  if (allPricesAvailable && totalCost > 0) {
    const returnRate = (totalMarketValue - totalCost) / totalCost;

    if (returnRate < -0.1) {
      alerts.push({
        id: "PORTFOLIO-portfolioLoss",
        symbol: "PORTFOLIO",
        companyName: "组合",
        type: "portfolioLoss",
        level: "high",
        message: "组合总亏损超过 -10%，需关注整体回撤风险。",
        createdAt,
      });
    }
  }

  for (const row of positionRows) {
    if (row.stock?.riskLevel === "高") {
      alerts.push(
        createAlert(
          row.stock,
          "highRiskHolding",
          "high",
          "持仓中存在高风险等级股票，需关注风险暴露。",
          createdAt,
        ),
      );
    }
  }

  return alerts;
}
