import "server-only";

import { getQuote, type FmpQuote } from "@/lib/api/fmp";

export type SupplyChainRegion = "US" | "Taiwan" | "Korea" | "Japan" | "Europe";

export type SupplyChainNarrative =
  | "AI capex"
  | "HBM"
  | "inference"
  | "datacenter power"
  | "optical networking"
  | "robotics"
  | "cloud AI";

export type SupplyChainCompany = {
  id: string;
  name: string;
  ticker: string;
  quoteSymbol: string;
  region: SupplyChainRegion;
  layerId: string;
  role: string;
  narratives: SupplyChainNarrative[];
};

export type SupplyChainLayer = {
  id: string;
  name: string;
  order: number;
  thesis: string;
};

export type SupplyChainCompanyWithQuote = SupplyChainCompany & {
  quote: FmpQuote;
};

export type SupplyChainLayerDetail = SupplyChainLayer & {
  companies: SupplyChainCompanyWithQuote[];
};

export const globalSupplyChainLayers: SupplyChainLayer[] = [
  {
    id: "semi-equipment",
    name: "Semiconductor Equipment",
    order: 1,
    thesis: "Lithography, process, test, and back-end tools set capacity velocity.",
  },
  {
    id: "foundry",
    name: "Foundry",
    order: 2,
    thesis: "Leading-node manufacturing converts AI silicon demand into wafers.",
  },
  {
    id: "advanced-packaging",
    name: "Advanced Packaging / Testing",
    order: 3,
    thesis: "CoWoS, test, and advanced packaging turn dies into AI systems.",
  },
  {
    id: "accelerators",
    name: "AI Chips / Accelerators",
    order: 4,
    thesis: "Compute platforms and custom silicon define the first AI control point.",
  },
  {
    id: "hbm-memory",
    name: "HBM / Memory",
    order: 5,
    thesis: "Memory bandwidth and HBM supply gate accelerator availability.",
  },
  {
    id: "networking-optical",
    name: "Networking / Optical / CPO",
    order: 6,
    thesis: "Scale-out clusters require switching, optical links, and CPO migration.",
  },
  {
    id: "datacenter-power",
    name: "Datacenter Power / Cooling",
    order: 7,
    thesis: "Rack density shifts bottlenecks to power, thermal, and electrical systems.",
  },
  {
    id: "cloud-hyperscalers",
    name: "Cloud / Hyperscalers",
    order: 8,
    thesis: "Cloud balance sheets translate model demand into physical capex.",
  },
  {
    id: "software-data",
    name: "AI Software / Data Platform",
    order: 9,
    thesis: "Data, observability, and workflow layers monetize AI adoption.",
  },
  {
    id: "ai-applications",
    name: "AI Applications",
    order: 10,
    thesis: "Application vendors package AI into repeatable vertical workflows.",
  },
  {
    id: "robotics-automation",
    name: "Robotics / Automation",
    order: 11,
    thesis: "AI expands automation potential beyond digital workloads.",
  },
];

export const globalSupplyChainCompanies: SupplyChainCompany[] = [
  company("nvidia", "NVIDIA", "NVDA", "US", "accelerators", "GPU platform leader", [
    "AI capex",
    "inference",
  ]),
  company("amd", "AMD", "AMD", "US", "accelerators", "Merchant accelerator challenger", [
    "AI capex",
    "inference",
  ]),
  company("broadcom", "Broadcom", "AVGO", "US", "accelerators", "Custom ASIC and connectivity", [
    "AI capex",
    "cloud AI",
  ]),
  company("mediatek", "MediaTek", "2454.TW", "Taiwan", "accelerators", "Edge AI and SoC exposure", [
    "inference",
  ]),
  company("infineon", "Infineon", "IFX.DE", "Europe", "accelerators", "Power semis and edge silicon", [
    "AI capex",
  ]),
  company("stmicro", "STMicroelectronics", "STM", "Europe", "accelerators", "Industrial and edge semis", [
    "inference",
  ]),

  company("micron", "Micron", "MU", "US", "hbm-memory", "US-listed HBM and DRAM exposure", [
    "HBM",
    "AI capex",
  ]),
  company("sk-hynix", "SK Hynix", "000660.KS", "Korea", "hbm-memory", "HBM leader", [
    "HBM",
  ]),
  company("samsung", "Samsung Electronics", "005930.KS", "Korea", "hbm-memory", "Memory and foundry platform", [
    "HBM",
    "AI capex",
  ]),

  company("tsmc", "TSMC", "TSM", "Taiwan", "foundry", "Advanced-node foundry bottleneck", [
    "AI capex",
  ]),
  company("samsung-foundry", "Samsung Electronics", "005930.KS", "Korea", "foundry", "Alternative leading-edge foundry", [
    "AI capex",
  ]),

  company("asml", "ASML", "ASML", "Europe", "semi-equipment", "EUV lithography monopoly", [
    "AI capex",
  ]),
  company("asm-intl", "ASM International", "ASMI.AS", "Europe", "semi-equipment", "Deposition process tools", [
    "AI capex",
  ]),
  company("tokyo-electron", "Tokyo Electron", "8035.T", "Japan", "semi-equipment", "Process equipment leader", [
    "AI capex",
  ]),
  company("advantest", "Advantest", "6857.T", "Japan", "semi-equipment", "Semiconductor test equipment", [
    "AI capex",
  ]),
  company("disco", "Disco", "6146.T", "Japan", "semi-equipment", "Wafer cutting and grinding tools", [
    "AI capex",
  ]),
  company("lasertec", "Lasertec", "6920.T", "Japan", "semi-equipment", "Mask inspection tools", [
    "AI capex",
  ]),

  company("ase", "ASE Technology", "ASX", "Taiwan", "advanced-packaging", "OSAT and advanced packaging", [
    "AI capex",
  ]),
  company("besi", "BE Semiconductor", "BESI.AS", "Europe", "advanced-packaging", "Hybrid bonding and assembly", [
    "AI capex",
  ]),
  company("hanmi", "Hanmi Semiconductor", "042700.KQ", "Korea", "advanced-packaging", "HBM packaging equipment", [
    "HBM",
    "AI capex",
  ]),

  company("marvell", "Marvell", "MRVL", "US", "networking-optical", "Custom silicon and electro-optics", [
    "optical networking",
    "cloud AI",
  ]),
  company("arista", "Arista", "ANET", "US", "networking-optical", "AI Ethernet switching", [
    "optical networking",
    "AI capex",
  ]),
  company("coherent", "Coherent", "COHR", "US", "networking-optical", "Optical components and transceivers", [
    "optical networking",
  ]),
  company("fabrinet", "Fabrinet", "FN", "US", "networking-optical", "Optical manufacturing services", [
    "optical networking",
  ]),

  company("vertiv", "Vertiv", "VRT", "US", "datacenter-power", "Power and cooling systems", [
    "datacenter power",
    "AI capex",
  ]),
  company("eaton", "Eaton", "ETN", "US", "datacenter-power", "Electrical infrastructure", [
    "datacenter power",
  ]),
  company("schneider", "Schneider Electric", "SU.PA", "Europe", "datacenter-power", "Electrical and energy management", [
    "datacenter power",
  ]),
  company("smci", "Super Micro Computer", "SMCI", "US", "datacenter-power", "AI server integration", [
    "AI capex",
    "datacenter power",
  ]),
  company("quanta", "Quanta", "2382.TW", "Taiwan", "datacenter-power", "Server ODM", [
    "AI capex",
    "cloud AI",
  ]),
  company("wistron", "Wistron", "3231.TW", "Taiwan", "datacenter-power", "Server and infrastructure ODM", [
    "AI capex",
  ]),
  company("wiwynn", "Wiwynn", "6669.TW", "Taiwan", "datacenter-power", "Cloud server platform", [
    "AI capex",
    "cloud AI",
  ]),

  company("microsoft", "Microsoft", "MSFT", "US", "cloud-hyperscalers", "Azure and AI platform", [
    "cloud AI",
    "AI capex",
  ]),
  company("amazon", "Amazon", "AMZN", "US", "cloud-hyperscalers", "AWS AI infrastructure", [
    "cloud AI",
    "AI capex",
  ]),
  company("alphabet", "Alphabet", "GOOGL", "US", "cloud-hyperscalers", "Google Cloud and TPU platform", [
    "cloud AI",
    "inference",
  ]),
  company("oracle", "Oracle", "ORCL", "US", "cloud-hyperscalers", "OCI AI capacity challenger", [
    "cloud AI",
  ]),

  company("palantir", "Palantir", "PLTR", "US", "software-data", "Operational AI workflow platform", [
    "cloud AI",
    "inference",
  ]),
  company("snowflake", "Snowflake", "SNOW", "US", "software-data", "AI data cloud", [
    "cloud AI",
  ]),
  company("datadog", "Datadog", "DDOG", "US", "software-data", "Observability for cloud AI systems", [
    "cloud AI",
  ]),
  company("sap", "SAP", "SAP", "Europe", "software-data", "Enterprise data and AI workflows", [
    "cloud AI",
  ]),

  company("adobe", "Adobe", "ADBE", "US", "ai-applications", "Creative and document AI applications", [
    "inference",
    "cloud AI",
  ]),
  company("servicenow", "ServiceNow", "NOW", "US", "ai-applications", "Enterprise workflow AI", [
    "inference",
    "cloud AI",
  ]),

  company("fanuc", "FANUC", "6954.T", "Japan", "robotics-automation", "Industrial robotics", [
    "robotics",
  ]),
  company("keyence", "Keyence", "6861.T", "Japan", "robotics-automation", "Factory automation sensors", [
    "robotics",
  ]),
  company("siemens", "Siemens", "SIE.DE", "Europe", "robotics-automation", "Industrial automation and digital twin", [
    "robotics",
  ]),
];

function company(
  id: string,
  name: string,
  quoteSymbol: string,
  region: SupplyChainRegion,
  layerId: string,
  role: string,
  narratives: SupplyChainNarrative[],
): SupplyChainCompany {
  return {
    id,
    name,
    ticker: quoteSymbol,
    quoteSymbol,
    region,
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

const sanitizeQuote = (symbol: string, quote: FmpQuote | null): FmpQuote => {
  if (!quote) {
    return missingQuote(symbol);
  }

  if (quote.dataSource === "mock") {
    return missingQuote(symbol);
  }

  if (quote.dataSource === "fmp" || quote.dataSource === "yahoo") {
    return quote;
  }

  return missingQuote(symbol);
};

export async function getGlobalSupplyChain(): Promise<SupplyChainLayerDetail[]> {
  const uniqueSymbols = Array.from(
    new Set(globalSupplyChainCompanies.map((item) => item.quoteSymbol)),
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
  const companies = globalSupplyChainCompanies.map((item) => ({
    ...item,
    quote: quoteMap.get(item.quoteSymbol) ?? missingQuote(item.quoteSymbol),
  }));

  return globalSupplyChainLayers
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((layer) => ({
      ...layer,
      companies: companies.filter((company) => company.layerId === layer.id),
    }));
}
