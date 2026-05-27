import "server-only";

import { getQuote, type FmpQuote } from "@/lib/api/fmp";

export type ChinaExchange = "A-share" | "STAR" | "HK" | "ADR" | "Ecosystem";

export type ChinaPolicyNarrative =
  | "China Domestic Substitution"
  | "Sovereign AI"
  | "Export Control Pressure"
  | "AI Compute Localization"
  | "Semiconductor Self-Sufficiency"
  | "Optical / PCB AI Capex";

export type ChinaSupplyChainLayer = {
  id: string;
  name: string;
  secondary: string;
  order: number;
  thesis: string;
};

export type ChinaSupplyChainCompany = {
  id: string;
  chineseName: string;
  englishName: string;
  ticker: string | null;
  quoteSymbol: string | null;
  exchange: ChinaExchange;
  layerId: string;
  role: string;
  narratives: ChinaPolicyNarrative[];
};

export type ChinaSupplyChainCompanyWithQuote = ChinaSupplyChainCompany & {
  quote: FmpQuote;
};

export type ChinaSupplyChainLayerDetail = ChinaSupplyChainLayer & {
  companies: ChinaSupplyChainCompanyWithQuote[];
};

export const chinaSupplyChainLayers: ChinaSupplyChainLayer[] = [
  layer("accelerators", "AI Chips / Accelerators", "AI芯片与加速器", 1, "Domestic accelerators and CPU/GPU alternatives sit at the center of compute localization."),
  layer("foundry", "Foundry", "晶圆代工", 2, "Local wafer manufacturing is the base-layer constraint for sovereign AI silicon."),
  layer("semi-equipment", "Semiconductor Equipment", "半导体设备", 3, "Equipment localization determines how fast domestic fabs can reduce external choke points."),
  layer("eda-ip-design", "EDA / IP / Silicon Design", "EDA / IP / 芯片设计", 4, "Domestic EDA and IP reduce upstream design-tool dependence."),
  layer("advanced-packaging", "Advanced Packaging / Testing", "先进封装与测试", 5, "Advanced packaging and testing convert constrained dies into usable AI systems."),
  layer("memory-storage", "HBM / Memory / Storage", "HBM高带宽存储 / 存储", 6, "Memory, storage, and interface chips remain critical gaps in localized AI infrastructure."),
  layer("ai-servers", "AI Servers / ODM", "AI服务器 / 整机制造", 7, "Server platforms aggregate domestic accelerators, networking, power, and thermal constraints."),
  layer("pcb-interconnect", "PCB / High-Speed Interconnect", "PCB / 高速互联", 8, "High-speed boards and interconnect become second-order beneficiaries of AI server density."),
  layer("optical-cpo", "Optical Networking / CPO", "光模块 / 共封装光学", 9, "AI clusters require 800G/1.6T optics and potential CPO migration."),
  layer("datacenter-power", "Datacenter Power / Cooling", "数据中心电力 / 散热", 10, "Power and cooling determine the pace of localized AI datacenter deployment."),
  layer("cloud-ai-platforms", "Cloud / AI Platforms", "云与AI平台", 11, "Cloud and model platforms translate policy support into compute demand."),
  layer("ai-applications", "AI Applications / Software", "AI应用与软件", 12, "Applications test whether localized AI infrastructure becomes recurring software revenue."),
];

export const chinaSupplyChainCompanies: ChinaSupplyChainCompany[] = [
  company("cambricon", "寒武纪", "Cambricon", "688256", "688256.SS", "STAR", "accelerators", "Domestic AI accelerator pure play", ["China Domestic Substitution", "AI Compute Localization", "Export Control Pressure"]),
  company("hygon", "海光信息", "Hygon", "688041", "688041.SS", "STAR", "accelerators", "CPU/GPU platform for localized compute", ["China Domestic Substitution", "Sovereign AI", "AI Compute Localization"]),
  company("loongson", "龙芯中科", "Loongson", "688047", "688047.SS", "STAR", "accelerators", "Domestic CPU architecture platform", ["China Domestic Substitution", "Sovereign AI"]),
  company("alibaba-thead-ecosystem", "阿里巴巴平头哥生态", "Alibaba T-Head Ecosystem", null, null, "Ecosystem", "accelerators", "Ecosystem / no direct listed ticker for the internal chip effort", ["AI Compute Localization", "Sovereign AI"]),
  company("baidu-kunlun-ecosystem", "百度昆仑生态", "Baidu Kunlun Ecosystem", null, null, "Ecosystem", "accelerators", "Ecosystem / no direct listed ticker for the internal accelerator effort", ["AI Compute Localization", "Sovereign AI"]),
  company("huawei-ecosystem", "华为昇腾生态", "Huawei Ascend Ecosystem", null, null, "Ecosystem", "accelerators", "Ecosystem / no direct listed ticker; no fake Huawei ticker assigned", ["China Domestic Substitution", "Sovereign AI", "Export Control Pressure"]),

  company("smic", "中芯国际", "SMIC", "688981", "688981.SS", "STAR", "foundry", "Domestic foundry base layer", ["Semiconductor Self-Sufficiency", "Export Control Pressure"]),
  company("hua-hong", "华虹半导体", "Hua Hong Semiconductor", "1347", "1347.HK", "HK", "foundry", "Specialty and mature-node foundry", ["China Domestic Substitution", "Semiconductor Self-Sufficiency"]),

  company("naura", "北方华创", "NAURA", "002371", "002371.SZ", "A-share", "semi-equipment", "Platform semiconductor equipment vendor", ["Semiconductor Self-Sufficiency", "Export Control Pressure"]),
  company("amec", "中微公司", "AMEC", "688012", "688012.SS", "STAR", "semi-equipment", "Etch and process equipment", ["Semiconductor Self-Sufficiency", "Export Control Pressure"]),
  company("piotech", "拓荆科技", "Piotech", "688072", "688072.SS", "STAR", "semi-equipment", "Deposition equipment localization", ["Semiconductor Self-Sufficiency"]),
  company("hwatsing", "华海清科", "Hwatsing", "688120", "688120.SS", "STAR", "semi-equipment", "CMP and wafer process tools", ["Semiconductor Self-Sufficiency"]),
  company("kingsemi", "芯源微", "Kingsemi", "688037", "688037.SS", "STAR", "semi-equipment", "Coater/developer and process equipment", ["Semiconductor Self-Sufficiency"]),
  company("acm-shanghai", "盛美上海", "ACM Research Shanghai", "688082", "688082.SS", "STAR", "semi-equipment", "Cleaning and wet process equipment", ["Semiconductor Self-Sufficiency"]),

  company("empyrean", "华大九天", "Empyrean Technology", "301269", "301269.SZ", "A-share", "eda-ip-design", "Domestic EDA platform", ["Semiconductor Self-Sufficiency", "Sovereign AI"]),
  company("primarius", "概伦电子", "Primarius", "688206", "688206.SS", "STAR", "eda-ip-design", "EDA and device modeling", ["Semiconductor Self-Sufficiency"]),
  company("verisilicon", "芯原股份", "VeriSilicon", "688521", "688521.SS", "STAR", "eda-ip-design", "Silicon IP and chip design services", ["China Domestic Substitution", "AI Compute Localization"]),

  company("jcet", "长电科技", "JCET", "600584", "600584.SS", "A-share", "advanced-packaging", "OSAT and advanced packaging platform", ["China Domestic Substitution", "AI Compute Localization"]),
  company("tongfu", "通富微电", "Tongfu Microelectronics", "002156", "002156.SZ", "A-share", "advanced-packaging", "HPC packaging and testing", ["China Domestic Substitution", "AI Compute Localization"]),
  company("huatian", "华天科技", "Huatian Technology", "002185", "002185.SZ", "A-share", "advanced-packaging", "Packaging and testing capacity", ["China Domestic Substitution"]),
  company("forehope", "甬矽电子", "Forehope Electronic", "688362", "688362.SS", "STAR", "advanced-packaging", "Advanced packaging and testing", ["AI Compute Localization"]),

  company("gigadevice", "兆易创新", "GigaDevice", "603986", "603986.SS", "A-share", "memory-storage", "Memory and MCU exposure", ["China Domestic Substitution"]),
  company("ingenic", "北京君正", "Ingenic", "300223", "300223.SZ", "A-share", "memory-storage", "Memory and edge processing exposure", ["China Domestic Substitution"]),
  company("montage", "澜起科技", "Montage Technology", "688008", "688008.SS", "STAR", "memory-storage", "Memory interface and server chips", ["AI Compute Localization", "Semiconductor Self-Sufficiency"]),
  company("biwin", "佰维存储", "Biwin Storage", "688525", "688525.SS", "STAR", "memory-storage", "Storage modules and memory products", ["China Domestic Substitution"]),

  company("inspur", "浪潮信息", "Inspur Information", "000977", "000977.SZ", "A-share", "ai-servers", "AI server platform", ["AI Compute Localization", "China Domestic Substitution"]),
  company("fii", "工业富联", "Foxconn Industrial Internet", "601138", "601138.SS", "A-share", "ai-servers", "AI server manufacturing and integration", ["AI Compute Localization", "Optical / PCB AI Capex"]),
  company("sugon", "中科曙光", "Sugon", "603019", "603019.SS", "A-share", "ai-servers", "Domestic HPC and server platform", ["Sovereign AI", "AI Compute Localization"]),
  company("unisplendour", "紫光股份", "Unisplendour", "000938", "000938.SZ", "A-share", "ai-servers", "Enterprise networking and server exposure", ["China Domestic Substitution", "AI Compute Localization"]),

  company("wus", "沪电股份", "WUS Printed Circuit", "002463", "002463.SZ", "A-share", "pcb-interconnect", "High-speed PCB for AI servers", ["Optical / PCB AI Capex"]),
  company("victory-giant", "胜宏科技", "Victory Giant", "300476", "300476.SZ", "A-share", "pcb-interconnect", "AI server PCB beneficiary", ["Optical / PCB AI Capex"]),
  company("shennan", "深南电路", "Shennan Circuits", "002916", "002916.SZ", "A-share", "pcb-interconnect", "High-speed PCB and substrate platform", ["Optical / PCB AI Capex"]),
  company("shengyi", "生益科技", "Shengyi Technology", "600183", "600183.SS", "A-share", "pcb-interconnect", "Copper-clad laminate and PCB materials", ["Optical / PCB AI Capex"]),

  company("innolight", "中际旭创", "Zhongji Innolight", "300308", "300308.SZ", "A-share", "optical-cpo", "High-speed optical module leader", ["Optical / PCB AI Capex", "AI Compute Localization"]),
  company("eoptolink", "新易盛", "Eoptolink", "300502", "300502.SZ", "A-share", "optical-cpo", "Datacenter optical modules", ["Optical / PCB AI Capex"]),
  company("tfc", "天孚通信", "TFC Communication", "300394", "300394.SZ", "A-share", "optical-cpo", "Optical components and packaging", ["Optical / PCB AI Capex"]),
  company("hgtech", "华工科技", "HGTECH", "000988", "000988.SZ", "A-share", "optical-cpo", "Optical modules and laser tech", ["Optical / PCB AI Capex", "China Domestic Substitution"]),
  company("accelink", "光迅科技", "Accelink", "002281", "002281.SZ", "A-share", "optical-cpo", "Optical communication modules", ["Optical / PCB AI Capex", "China Domestic Substitution"]),
  company("yuanjie", "源杰科技", "Yuanjie Semiconductor", "688498", "688498.SS", "STAR", "optical-cpo", "Optical chip supplier", ["Optical / PCB AI Capex", "Semiconductor Self-Sufficiency"]),

  company("envicool", "英维克", "Envicool", "002837", "002837.SZ", "A-share", "datacenter-power", "Datacenter cooling systems", ["AI Compute Localization"]),
  company("kehua", "科华数据", "Kehua Data", "002335", "002335.SZ", "A-share", "datacenter-power", "Power and datacenter infrastructure", ["AI Compute Localization"]),
  company("shenling", "申菱环境", "Shenling Environmental", "301018", "301018.SZ", "A-share", "datacenter-power", "Thermal management and HVAC", ["AI Compute Localization"]),
  company("goaland", "高澜股份", "Goaland Energy", "300499", "300499.SZ", "A-share", "datacenter-power", "Liquid cooling and thermal systems", ["AI Compute Localization"]),

  company("alibaba-cloud", "阿里巴巴", "Alibaba", "9988", "9988.HK", "HK", "cloud-ai-platforms", "Cloud AI and model platform", ["Sovereign AI", "AI Compute Localization"]),
  company("baidu-cloud", "百度", "Baidu", "9888", "9888.HK", "HK", "cloud-ai-platforms", "AI cloud and foundation model platform", ["Sovereign AI", "AI Compute Localization"]),
  company("tencent", "腾讯", "Tencent", "0700", "0700.HK", "HK", "cloud-ai-platforms", "Cloud, model, and application platform", ["Sovereign AI", "AI Compute Localization"]),
  company("kingsoft-cloud", "金山云", "Kingsoft Cloud", "3896", "3896.HK", "HK", "cloud-ai-platforms", "Independent cloud platform", ["Sovereign AI"]),

  company("iflytek", "科大讯飞", "iFlytek", "002230", "002230.SZ", "A-share", "ai-applications", "Domestic AI application and model platform", ["China Domestic Substitution", "Sovereign AI"]),
  company("kingsoft-office", "金山办公", "Kingsoft Office", "688111", "688111.SS", "STAR", "ai-applications", "Office AI software", ["China Domestic Substitution"]),
  company("yonyou", "用友网络", "Yonyou", "600588", "600588.SS", "A-share", "ai-applications", "Enterprise software and AI workflows", ["China Domestic Substitution"]),
  company("kingdee", "金蝶国际", "Kingdee", "0268", "0268.HK", "HK", "ai-applications", "Enterprise SaaS and AI workflows", ["China Domestic Substitution"]),
  company("sensetime", "商汤", "SenseTime", "0020", "0020.HK", "HK", "ai-applications", "Computer vision and foundation model platform", ["Sovereign AI"]),
  company("meitu", "美图", "Meitu", "1357", "1357.HK", "HK", "ai-applications", "Consumer imaging and AI applications", ["China Domestic Substitution"]),
];

function layer(
  id: string,
  name: string,
  secondary: string,
  order: number,
  thesis: string,
): ChinaSupplyChainLayer {
  return { id, name, secondary, order, thesis };
}

function company(
  id: string,
  chineseName: string,
  englishName: string,
  ticker: string | null,
  quoteSymbol: string | null,
  exchange: ChinaExchange,
  layerId: string,
  role: string,
  narratives: ChinaPolicyNarrative[],
): ChinaSupplyChainCompany {
  return {
    id,
    chineseName,
    englishName,
    ticker,
    quoteSymbol,
    exchange,
    layerId,
    role,
    narratives,
  };
}

const missingQuote = (symbol: string): FmpQuote => ({
  symbol,
  name: symbol,
  price: null,
  previousClose: null,
  change: null,
  changesPercentage: null,
  marketCap: null,
  pe: null,
  psRatio: null,
  dataStatus: "missing",
  dataSource: "none",
});

const sanitizeQuote = (symbol: string | null, quote: FmpQuote | null): FmpQuote => {
  const fallbackSymbol = symbol ?? "N/A";

  if (!quote || quote.dataSource === "mock") {
    return missingQuote(fallbackSymbol);
  }

  if (
    (quote.dataSource === "fmp" || quote.dataSource === "yahoo") &&
    typeof quote.price === "number" &&
    Number.isFinite(quote.price) &&
    quote.price > 0
  ) {
    return quote;
  }

  return missingQuote(fallbackSymbol);
};

export async function getChinaSupplyChain(): Promise<ChinaSupplyChainLayerDetail[]> {
  const uniqueSymbols = Array.from(
    new Set(
      chinaSupplyChainCompanies
        .map((item) => item.quoteSymbol)
        .filter((symbol): symbol is string => Boolean(symbol)),
    ),
  );
  const quotes = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        return [symbol, sanitizeQuote(symbol, await getQuote(symbol))] as const;
      } catch {
        return [symbol, missingQuote(symbol)] as const;
      }
    }),
  );
  const quoteMap = new Map<string, FmpQuote>(quotes);
  const companies = chinaSupplyChainCompanies.map((item) => ({
    ...item,
    quote: item.quoteSymbol
      ? quoteMap.get(item.quoteSymbol) ?? missingQuote(item.quoteSymbol)
      : missingQuote("N/A"),
  }));

  return chinaSupplyChainLayers
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((layer) => ({
      ...layer,
      companies: companies.filter((company) => company.layerId === layer.id),
    }));
}
