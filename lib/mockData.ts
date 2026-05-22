export type TrendPoint = {
  date: string;
  price: number;
};

export type Stock = {
  symbol: string;
  companyName: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: string;
  peRatio: number | null;
  psRatio: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  sector: string;
  industry: string;
  nextEarningsDate: string;
  aiSummary: string;
  riskLevel: "高" | "中" | "低";
  dataStatus: "live" | "fallback" | "missing";
  dataSource?: "fmp" | "yahoo" | "mock" | "none";
  news: StockNews[];
  chart: TrendPoint[];
};

export type StockNews = {
  id: string;
  title: string;
  publisher: string;
  publishedDate: string;
  url?: string;
};

export type IndexQuote = {
  name: string;
  symbol: string;
  value: string;
  change: number;
  changePercent: number;
  breadth: string;
};

export type Alert = {
  id: string;
  level: "高" | "中" | "低";
  title: string;
  description: string;
  symbol?: string;
};

export const indexQuotes: IndexQuote[] = [
  {
    name: "标普500",
    symbol: "S&P 500",
    value: "5,321.78",
    change: 31.26,
    changePercent: 0.59,
    breadth: "上涨成分股 61%",
  },
  {
    name: "纳斯达克",
    symbol: "NASDAQ",
    value: "16,832.62",
    change: 128.74,
    changePercent: 0.77,
    breadth: "科技权重强势",
  },
  {
    name: "道琼斯",
    symbol: "DJIA",
    value: "39,842.11",
    change: -42.18,
    changePercent: -0.11,
    breadth: "工业股分化",
  },
];

const baseChart: TrendPoint[] = [
  { date: "05-10", price: 100 },
  { date: "05-11", price: 101.8 },
  { date: "05-12", price: 100.9 },
  { date: "05-13", price: 103.1 },
  { date: "05-14", price: 105.4 },
  { date: "05-15", price: 104.7 },
  { date: "05-16", price: 107.5 },
  { date: "05-17", price: 109.2 },
  { date: "05-18", price: 108.6 },
  { date: "05-19", price: 111.4 },
  { date: "05-20", price: 113.2 },
];

const scaleChart = (base: number, drift: number): TrendPoint[] =>
  baseChart.map((point, index) => ({
    date: point.date,
    price: Number((base + (point.price - 100) * drift + index * 0.45).toFixed(2)),
  }));

export const watchlistStocks: Stock[] = [
  {
    symbol: "AAPL",
    companyName: "苹果",
    price: 193.42,
    change: 1.86,
    changePercent: 0.97,
    marketCap: "2.96T",
    peRatio: 30.8,
    psRatio: 7.4,
    revenueGrowth: 2.1,
    grossMargin: 46.6,
    netMargin: 26.3,
    sector: "消费电子",
    industry: "智能手机与消费硬件",
    nextEarningsDate: "2026-07-30",
    aiSummary:
      "苹果短线受益于回购和服务收入韧性，硬件换机周期仍是主要观察点。估值处于偏高区间，适合关注新品周期与毛利率稳定性。",
    riskLevel: "中",
    dataStatus: "fallback",
    news: [
      {
        id: "AAPL-mock-1",
        title: "苹果服务收入韧性继续支撑利润率预期",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(188, 0.78),
  },
  {
    symbol: "MSFT",
    companyName: "微软",
    price: 431.28,
    change: 4.92,
    changePercent: 1.15,
    marketCap: "3.21T",
    peRatio: 36.1,
    psRatio: 12.5,
    revenueGrowth: 15.4,
    grossMargin: 69.8,
    netMargin: 36.4,
    sector: "云计算 / 软件",
    industry: "企业软件与云平台",
    nextEarningsDate: "2026-07-28",
    aiSummary:
      "微软基本面由云业务和 AI 工作负载驱动，收入质量较高。当前核心变量是 Azure 增速、AI 资本开支回报和企业软件预算。",
    riskLevel: "低",
    dataStatus: "fallback",
    news: [
      {
        id: "MSFT-mock-1",
        title: "Azure 与 AI 工作负载维持企业软件板块关注度",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(416, 1.42),
  },
  {
    symbol: "NVDA",
    companyName: "英伟达",
    price: 948.31,
    change: 28.16,
    changePercent: 3.06,
    marketCap: "2.34T",
    peRatio: 54.7,
    psRatio: 31.2,
    revenueGrowth: 126.4,
    grossMargin: 76.0,
    netMargin: 53.4,
    sector: "半导体 / AI",
    industry: "GPU 与数据中心加速器",
    nextEarningsDate: "2026-08-26",
    aiSummary:
      "英伟达仍是 AI 算力链条的核心标的，增长和利润率表现强劲。主要风险来自高预期、供应链波动以及客户资本开支节奏变化。",
    riskLevel: "中",
    dataStatus: "fallback",
    news: [
      {
        id: "NVDA-mock-1",
        title: "AI 算力需求仍是半导体板块的核心交易线索",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(882, 5.7),
  },
  {
    symbol: "AMZN",
    companyName: "亚马逊",
    price: 186.17,
    change: 0.74,
    changePercent: 0.4,
    marketCap: "1.94T",
    peRatio: 51.2,
    psRatio: 3.4,
    revenueGrowth: 12.8,
    grossMargin: 48.9,
    netMargin: 8.9,
    sector: "电商 / 云计算",
    industry: "电商平台与云基础设施",
    nextEarningsDate: "2026-07-31",
    aiSummary:
      "亚马逊的利润修复仍在推进，AWS 增长和广告业务是估值支撑。需跟踪零售履约成本、云竞争和消费需求变化。",
    riskLevel: "中",
    dataStatus: "fallback",
    news: [
      {
        id: "AMZN-mock-1",
        title: "AWS 增长和广告业务继续成为亚马逊利润修复主线",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(178, 0.9),
  },
  {
    symbol: "GOOGL",
    companyName: "谷歌",
    price: 176.83,
    change: -1.22,
    changePercent: -0.69,
    marketCap: "2.18T",
    peRatio: 27.6,
    psRatio: 6.8,
    revenueGrowth: 13.1,
    grossMargin: 57.4,
    netMargin: 27.9,
    sector: "互联网广告",
    industry: "搜索广告与云服务",
    nextEarningsDate: "2026-07-23",
    aiSummary:
      "谷歌搜索和 YouTube 现金流稳健，AI 搜索形态变化是中长期变量。估值相对大型科技同业仍具一定防御性。",
    riskLevel: "中",
    dataStatus: "fallback",
    news: [
      {
        id: "GOOGL-mock-1",
        title: "AI 搜索产品形态继续影响互联网广告估值讨论",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(181, -0.28),
  },
  {
    symbol: "META",
    companyName: "Meta",
    price: 487.12,
    change: 7.64,
    changePercent: 1.59,
    marketCap: "1.24T",
    peRatio: 25.4,
    psRatio: 8.9,
    revenueGrowth: 24.7,
    grossMargin: 81.5,
    netMargin: 32.1,
    sector: "社交媒体 / 广告",
    industry: "社交网络与数字广告",
    nextEarningsDate: "2026-07-29",
    aiSummary:
      "Meta 广告业务恢复强劲，成本纪律改善利润弹性。AI 推荐系统提升变现效率，但元宇宙投入仍需持续评估。",
    riskLevel: "低",
    dataStatus: "fallback",
    news: [
      {
        id: "META-mock-1",
        title: "Meta 广告变现效率改善，利润弹性仍受市场关注",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(462, 2.25),
  },
  {
    symbol: "TSLA",
    companyName: "特斯拉",
    price: 174.09,
    change: -4.51,
    changePercent: -2.53,
    marketCap: "554B",
    peRatio: 62.8,
    psRatio: 5.9,
    revenueGrowth: -8.7,
    grossMargin: 17.4,
    netMargin: 7.6,
    sector: "电动车 / 能源",
    industry: "电动车与储能系统",
    nextEarningsDate: "2026-07-22",
    aiSummary:
      "特斯拉短期承压来自交付增速放缓与价格竞争。市场对自动驾驶和能源业务仍有期权定价，但盈利可见度需要改善。",
    riskLevel: "高",
    dataStatus: "fallback",
    news: [
      {
        id: "TSLA-mock-1",
        title: "价格竞争和交付节奏仍压制电动车链条风险偏好",
        publisher: "Mock Research",
        publishedDate: "2026-05-20",
      },
    ],
    chart: scaleChart(190, -1.2),
  },
];

export const aiMarketSummary = [
  "大型科技股继续承担指数上行动能，AI 算力、云服务和广告恢复是今日主要主线。",
  "市场风险偏好温和修复，但高估值板块对利率和盈利指引更敏感。",
  "短线建议把关注点放在财报后预期修正、成交量放大和关键均线得失。",
];

export const riskAlerts: Alert[] = [
  {
    id: "alert-1",
    level: "高",
    symbol: "TSLA",
    title: "盈利预期下修风险",
    description: "毛利率处于自选股低位，收入增长转负，需关注下一次交付数据。",
  },
  {
    id: "alert-2",
    level: "中",
    symbol: "NVDA",
    title: "高估值波动风险",
    description: "PS 显著高于同组，任何订单节奏变化都可能放大股价波动。",
  },
  {
    id: "alert-3",
    level: "中",
    symbol: "GOOGL",
    title: "短线趋势转弱",
    description: "今日跌幅领先大型科技股，观察能否重新站回近期均线。",
  },
  {
    id: "alert-4",
    level: "低",
    title: "指数集中度偏高",
    description: "指数上涨主要来自少数科技权重，市场宽度仍需继续确认。",
  },
];

export const dailyReportSections = [
  {
    title: "市场结构",
    content:
      "指数表现偏强但结构分化，AI 与云计算链条保持资金关注，防御板块相对平淡。当前盘面更像是盈利预期驱动，而不是全面风险偏好扩张。",
  },
  {
    title: "行业观察",
    content:
      "半导体、软件、互联网广告表现占优。电动车链条仍受到价格竞争和需求弹性的压制，短期更适合等待基本面拐点信号。",
  },
  {
    title: "组合提示",
    content:
      "自选股组合偏科技成长，波动相关性较高。可在研究层面加入现金流稳定、估值较低的对照标的，降低单一叙事对判断的影响。",
  },
];
