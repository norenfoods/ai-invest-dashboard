import {
  getCompanyProfile,
  getIncomeStatement,
  getMarketIndexes,
  getQuote,
  getStockNews,
  type FmpIncomeStatement,
  type FmpStockNews,
} from "@/lib/api/fmp";
import {
  indexQuotes,
  watchlistStocks,
  type IndexQuote,
  type Stock,
  type StockNews,
} from "@/lib/mockData";

type StockServiceOptions = {
  forceRefresh?: boolean;
};

export const watchlistSymbols = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
];

const formatMarketCap = (value?: number | null): string | null => {
  if (!value || value <= 0) {
    return null;
  }

  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `${Math.round(value / 1_000_000_000)}B`;
  }

  return `${Math.round(value / 1_000_000)}M`;
};

const roundedPercent = (value: number | null): number | null =>
  value === null || Number.isNaN(value) ? null : Number(value.toFixed(1));

const calculateRevenueGrowth = (
  statements: FmpIncomeStatement[],
): number | null => {
  const latest = statements[0]?.revenue;
  const previous = statements[1]?.revenue;

  if (!latest || !previous) {
    return null;
  }

  return roundedPercent(((latest - previous) / previous) * 100);
};

const calculateMargin = (
  numerator?: number,
  denominator?: number,
): number | null => {
  if (!numerator || !denominator) {
    return null;
  }

  return roundedPercent((numerator / denominator) * 100);
};

const mapNews = (news: FmpStockNews[], fallback: StockNews[]): StockNews[] => {
  if (!news.length) {
    return fallback;
  }

  return news.slice(0, 5).map((item, index) => ({
    id: `${item.symbol ?? "NEWS"}-${item.publishedDate ?? index}`,
    title: item.title ?? "未命名新闻",
    publisher: item.publisher ?? item.site ?? "FMP",
    publishedDate: item.publishedDate ?? "",
    url: item.url,
  }));
};

const normalizeSymbol = (symbol: string): string =>
  symbol.trim().replace(/\s+/g, "").toUpperCase();

const createFallbackStock = (symbol: string): Stock => {
  const normalized = normalizeSymbol(symbol);

  return {
    symbol: normalized,
    companyName: normalized,
    price: null,
    change: null,
    changePercent: null,
    marketCap: "N/A",
    peRatio: null,
    psRatio: null,
    revenueGrowth: null,
    grossMargin: null,
    netMargin: null,
    sector: "待确认",
    industry: "待确认",
    nextEarningsDate: "N/A",
    aiSummary: "暂无 mock 摘要，等待真实数据补充。",
    riskLevel: "中",
    dataStatus: "missing",
    dataSource: "none",
    news: [
      {
        id: `${normalized}-mock-news`,
        title: "暂无新闻数据，等待真实数据补充。",
        publisher: "Mock Research",
        publishedDate: "",
      },
    ],
    chart: [],
  };
};

const findMockStock = (symbol: string): Stock | undefined =>
  watchlistStocks.find(
    (stock) => stock.symbol.toLowerCase() === symbol.toLowerCase(),
  );

async function mergeStockData(
  mock: Stock,
  options: StockServiceOptions = {},
): Promise<Stock> {
  try {
    const [quote, profile, incomeStatement, news] = await Promise.all([
      getQuote(mock.symbol, options.forceRefresh),
      getCompanyProfile(mock.symbol, options.forceRefresh),
      getIncomeStatement(mock.symbol, options.forceRefresh),
      getStockNews(mock.symbol, options.forceRefresh),
    ]);

    if (!quote && !profile && incomeStatement.length === 0 && news.length === 0) {
      return mock;
    }

    const latestStatement = incomeStatement[0];
    const marketCap = quote?.marketCap ?? profile?.marketCap ?? profile?.mktCap;
    const revenue = latestStatement?.revenue;
    const psRatio =
      marketCap && revenue ? Number((marketCap / revenue).toFixed(1)) : null;
    const grossMargin = calculateMargin(
      latestStatement?.grossProfit,
      latestStatement?.revenue,
    );
    const netMargin = calculateMargin(
      latestStatement?.netIncome,
      latestStatement?.revenue,
    );

    return {
      ...mock,
      companyName: profile?.companyName ?? quote?.name ?? mock.companyName,
      price:
        quote?.dataStatus === "missing"
          ? null
          : quote?.price ?? profile?.price ?? mock.price,
      change: quote?.change ?? mock.change,
      changePercent: quote?.changesPercentage ?? mock.changePercent,
      marketCap: formatMarketCap(marketCap) ?? mock.marketCap,
      peRatio: quote?.pe ?? mock.peRatio,
      psRatio: quote?.psRatio ?? psRatio ?? mock.psRatio,
      revenueGrowth: calculateRevenueGrowth(incomeStatement) ?? mock.revenueGrowth,
      grossMargin: grossMargin ?? mock.grossMargin,
      netMargin: netMargin ?? mock.netMargin,
      sector: profile?.sector ?? mock.sector,
      industry: profile?.industry ?? mock.industry,
      news: mapNews(news, mock.news),
      dataStatus: quote?.dataStatus ?? mock.dataStatus,
      dataSource: quote?.dataSource ?? mock.dataSource ?? "mock",
    };
  } catch {
    return mock;
  }
}

export async function getWatchlistStocks(): Promise<Stock[]> {
  return getStocksBySymbols(watchlistSymbols);
}

export async function getStocksBySymbols(
  symbols: string[],
  options: StockServiceOptions = {},
): Promise<Stock[]> {
  try {
    const normalizedSymbols = symbols
      .map(normalizeSymbol)
      .filter((symbol, index, list) => symbol && list.indexOf(symbol) === index);

    const targetSymbols = normalizedSymbols.length
      ? normalizedSymbols
      : watchlistSymbols;

    return await Promise.all(
      targetSymbols.map((symbol) =>
        mergeStockData(
          findMockStock(symbol) ?? createFallbackStock(symbol),
          options,
        ),
      ),
    );
  } catch {
    return watchlistStocks.filter((stock) => symbols.includes(stock.symbol));
  }
}

export async function getStockBySymbol(
  symbol: string,
  options: StockServiceOptions = {},
): Promise<Stock | null> {
  try {
    const normalized = normalizeSymbol(symbol);
    const mock = findMockStock(normalized) ?? createFallbackStock(normalized);

    if (!normalized) {
      return null;
    }

    return await mergeStockData(mock, options);
  } catch {
    return findMockStock(symbol) ?? null;
  }
}

export async function getIndexQuotes(
  options: StockServiceOptions = {},
): Promise<IndexQuote[]> {
  try {
    const quotes = await getMarketIndexes(options.forceRefresh);

    if (!quotes.length) {
      return indexQuotes;
    }

    const labels: Record<string, Pick<IndexQuote, "name" | "breadth">> = {
      SPY: { name: "标普500 ETF", breadth: "SPY 实时代理" },
      QQQ: { name: "纳斯达克100 ETF", breadth: "QQQ 实时代理" },
      DIA: { name: "道琼斯ETF", breadth: "DIA 实时代理" },
    };

    return ["SPY", "QQQ", "DIA"].map((symbol, index) => {
      const quote = quotes.find((item) => item.symbol === symbol);
      const label = labels[symbol];
      const fallback = indexQuotes[index];

      return {
        name: label.name,
        symbol,
        value:
          quote?.price?.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) ?? fallback.value,
        change: quote?.change ?? fallback.change,
        changePercent: quote?.changesPercentage ?? fallback.changePercent,
        breadth: label.breadth,
      };
    });
  } catch {
    return indexQuotes;
  }
}
