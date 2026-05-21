export type PortfolioPosition = {
  symbol: string;
  shares: number;
  avgCost: number;
  currency: "USD";
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type PositionInput = {
  symbol: string;
  shares: number;
  avgCost: number;
  note?: string;
};
