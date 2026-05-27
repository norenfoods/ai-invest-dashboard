import type {
  AiCompanyNode,
  AiCompanyRelationship,
  AiIndustryCategory,
  AiMarketMap,
  AiNarrative,
  AiNarrativeCompany,
  AiThesis,
} from "@/lib/ai-industry/types";

export const aiMarketMapsSeed: AiMarketMap[] = [
  {
    id: "map-global-ai",
    slug: "global-ai",
    name: "Global AI Market Map",
    description:
      "Global AI infrastructure and application chain across US, Japan, Korea, Taiwan, and Europe.",
    region_scope: ["US", "Japan", "Korea", "Taiwan", "Europe"],
  },
  {
    id: "map-china-domestic-substitution",
    slug: "china-domestic-substitution",
    name: "China AI 国产替代 Market Map",
    description:
      "China AI domestic substitution chain focused on semiconductor sovereignty, infrastructure localization, and domestic AI applications.",
    region_scope: ["China", "Hong Kong"],
  },
];

const globalCategories = [
  ["gpu-accelerators", "GPU / Accelerators"],
  ["hbm-memory", "HBM / Memory"],
  ["foundry", "Foundry"],
  ["semiconductor-equipment", "Semiconductor Equipment"],
  ["networking-optical", "Networking / Optical"],
  ["datacenter-power", "Datacenter Infrastructure / Power"],
  ["ai-software-saas", "AI Software / SaaS"],
  ["robotics-automation", "Robotics / Automation"],
] as const;

const chinaCategories = [
  ["ai-chips", "AI chips"],
  ["foundry", "Foundry"],
  ["semiconductor-equipment", "Semiconductor equipment"],
  ["advanced-packaging-osat", "Advanced packaging / OSAT"],
  ["ai-servers", "AI servers"],
  ["optical-cpo", "Optical modules / CPO"],
  ["ai-applications-software", "AI applications / software"],
] as const;

export const aiIndustryCategoriesSeed: AiIndustryCategory[] = [
  ...globalCategories.map(([slug, name], index) => ({
    id: `cat-global-${slug}`,
    map_id: "map-global-ai",
    slug,
    name,
    sort_order: (index + 1) * 10,
    description: `${name} nodes in the global AI capital cycle.`,
  })),
  ...chinaCategories.map(([slug, name], index) => ({
    id: `cat-china-${slug}`,
    map_id: "map-china-domestic-substitution",
    slug,
    name,
    sort_order: (index + 1) * 10,
    description: `${name} nodes in the China domestic substitution chain.`,
  })),
];

const categoryId = (mapSlug: "global" | "china", slug: string) =>
  `cat-${mapSlug}-${slug}`;

const company = (
  id: string,
  ticker: string,
  exchange: string,
  name: string,
  region: string,
  country: string,
  map_id: string,
  category_id: string,
  ai_narrative: string,
  thesis: string,
  dependencies: string[],
  valuation = "Track valuation against AI revenue durability, cycle position, and execution risk.",
): AiCompanyNode => ({
  id,
  ticker,
  exchange,
  name,
  region,
  country,
  map_id,
  category_id,
  ai_narrative,
  thesis,
  beneficiaries: ["AI capex", "infrastructure demand"],
  dependency_relationships: dependencies,
  market_regime_relevance:
    "Most relevant when AI infrastructure spend, sovereign compute demand, and supply-chain bottlenecks drive market leadership.",
  valuation_context: valuation,
  earnings_memory:
    "MVP memory placeholder: track revenue mix, guidance, margin, backlog, and AI-specific management commentary.",
  is_core: true,
});

export const aiCompanyNodesSeed: AiCompanyNode[] = [
  company("co-nvda", "NVDA", "NASDAQ", "NVIDIA", "US", "United States", "map-global-ai", categoryId("global", "gpu-accelerators"), "Core accelerator platform for AI training and inference.", "NVIDIA remains the reference architecture for AI compute.", ["TSMC advanced nodes", "HBM supply", "advanced packaging"], "Premium multiple reflects dominant share and durable growth expectations."),
  company("co-amd", "AMD", "NASDAQ", "AMD", "US", "United States", "map-global-ai", categoryId("global", "gpu-accelerators"), "Second-source AI accelerator challenger.", "AMD is the most credible merchant GPU alternative.", ["TSMC advanced nodes", "HBM supply", "software ecosystem"]),
  company("co-avgo", "AVGO", "NASDAQ", "Broadcom", "US", "United States", "map-global-ai", categoryId("global", "networking-optical"), "Custom silicon and networking beneficiary of AI scale-out.", "Broadcom participates in AI through custom accelerators and switching.", ["hyperscaler capex", "advanced packaging"]),
  company("co-mu", "MU", "NASDAQ", "Micron", "US", "United States", "map-global-ai", categoryId("global", "hbm-memory"), "US memory exposure to HBM shortage.", "Micron gives liquid US exposure to HBM and memory cycle tightening.", ["HBM qualification", "DRAM cycle"]),
  company("co-sk-hynix", "000660", "KRX", "SK Hynix", "Korea", "South Korea", "map-global-ai", categoryId("global", "hbm-memory"), "HBM leader embedded in AI accelerator supply chains.", "SK Hynix is a primary HBM beneficiary.", ["HBM yields", "memory cycle"]),
  company("co-tsm", "TSM", "NYSE", "TSMC", "Taiwan", "Taiwan", "map-global-ai", categoryId("global", "foundry"), "Advanced-node foundry bottleneck for AI silicon.", "TSMC is the manufacturing choke point for leading AI accelerators.", ["geopolitics", "tool availability", "CoWoS capacity"]),
  company("co-asml", "ASML", "AMS", "ASML", "Europe", "Netherlands", "map-global-ai", categoryId("global", "semiconductor-equipment"), "EUV lithography monopoly for leading-edge AI chips.", "ASML controls the critical lithography layer.", ["export controls", "fab capex timing"]),
  company("co-tel", "8035", "TSE", "Tokyo Electron", "Japan", "Japan", "map-global-ai", categoryId("global", "semiconductor-equipment"), "Process equipment beneficiary of advanced logic and memory capex.", "Tokyo Electron is exposed to process complexity.", ["WFE cycle", "export controls"]),
  company("co-vrt", "VRT", "NYSE", "Vertiv", "US", "United States", "map-global-ai", categoryId("global", "datacenter-power"), "Power and cooling beneficiary of dense AI datacenters.", "Vertiv benefits as rack density turns cooling into a bottleneck.", ["datacenter build schedules", "power availability"]),
  company("co-etn", "ETN", "NYSE", "Eaton", "US", "Ireland", "map-global-ai", categoryId("global", "datacenter-power"), "Electrical infrastructure exposure to AI power demand.", "Eaton supplies power management infrastructure.", ["grid interconnect timing", "industrial cycle"]),
  company("co-anet", "ANET", "NYSE", "Arista Networks", "US", "United States", "map-global-ai", categoryId("global", "networking-optical"), "AI cluster networking leader.", "Arista benefits from Ethernet scale-out networking.", ["cloud titan capex", "switching cycles"]),
  company("co-cohr", "COHR", "NYSE", "Coherent", "US", "United States", "map-global-ai", categoryId("global", "networking-optical"), "Optical component exposure to AI datacenter bandwidth.", "Coherent benefits from optical transceiver demand.", ["optical cycle", "customer inventory"]),
  company("co-pltr", "PLTR", "NYSE", "Palantir", "US", "United States", "map-global-ai", categoryId("global", "ai-software-saas"), "Enterprise AI operating layer.", "Palantir monetizes AI through operational workflows.", ["enterprise deployment cycles", "valuation sensitivity"]),
  company("co-fanuc", "6954", "TSE", "FANUC", "Japan", "Japan", "map-global-ai", categoryId("global", "robotics-automation"), "Industrial automation node for AI-enabled manufacturing.", "FANUC offers robotics exposure to AI-enabled automation.", ["industrial capex", "China automation demand"]),
  company("co-cambricon", "688256", "SSE STAR", "寒武纪", "China", "China", "map-china-domestic-substitution", categoryId("china", "ai-chips"), "国产 AI 加速芯片核心标的。", "寒武纪代表中国 AI 芯片自主化的高弹性方向。", ["先进制程可得性", "软件生态", "客户验证"]),
  company("co-hygon", "688041", "SSE STAR", "海光信息", "China", "China", "map-china-domestic-substitution", categoryId("china", "ai-chips"), "国产 CPU/GPU 与服务器算力替代。", "海光信息受益于政企算力国产化。", ["先进制程", "生态兼容", "政府采购节奏"]),
  company("co-smic", "688981", "SSE STAR", "中芯国际", "China", "China", "map-china-domestic-substitution", categoryId("china", "foundry"), "中国先进制程与成熟制程制造底座。", "中芯国际是国产半导体供应链的制造底座。", ["设备限制", "良率", "地缘政策"]),
  company("co-huahong", "1347", "HKEX", "华虹半导体", "China", "China", "map-china-domestic-substitution", categoryId("china", "foundry"), "特色工艺与成熟制程国产替代。", "华虹半导体受益于特色工艺本土化需求。", ["周期利用率", "价格压力"]),
  company("co-naura", "002371", "SZSE", "北方华创", "China", "China", "map-china-domestic-substitution", categoryId("china", "semiconductor-equipment"), "国产半导体设备平台型龙头。", "北方华创是国产 fab 扩产和设备替代核心受益者。", ["客户验证", "零部件国产化", "capex 周期"]),
  company("co-amec", "688012", "SSE STAR", "中微公司", "China", "China", "map-china-domestic-substitution", categoryId("china", "semiconductor-equipment"), "刻蚀设备国产替代核心公司。", "中微公司在关键设备环节具备国产替代战略价值。", ["客户验证", "竞争格局"]),
  company("co-jcet", "600584", "SSE", "长电科技", "China", "China", "map-china-domestic-substitution", categoryId("china", "advanced-packaging-osat"), "先进封装与 OSAT 国产化平台。", "长电科技受益于 AI 芯片先进封装需求。", ["封装技术升级", "客户周期"]),
  company("co-tongfu", "002156", "SZSE", "通富微电", "China", "China", "map-china-domestic-substitution", categoryId("china", "advanced-packaging-osat"), "高性能计算封测与先进封装受益者。", "通富微电受益于国产 AI 供应链配套。", ["客户集中度", "封测周期"]),
  company("co-inspur", "000977", "SZSE", "浪潮信息", "China", "China", "map-china-domestic-substitution", categoryId("china", "ai-servers"), "AI 服务器国产基础设施。", "浪潮信息是国内 AI 服务器核心供应商。", ["加速卡供给", "服务器毛利率"]),
  company("co-foxconn-industrial", "601138", "SSE", "工业富联", "China", "China", "map-china-domestic-substitution", categoryId("china", "ai-servers"), "AI 服务器制造与算力硬件组装。", "工业富联受益于 AI 服务器制造和机柜集成需求。", ["客户集中度", "制造利润率"]),
  company("co-innolight", "300308", "SZSE", "中际旭创", "China", "China", "map-china-domestic-substitution", categoryId("china", "optical-cpo"), "高速光模块和 AI 网络核心受益者。", "中际旭创受益于 800G/1.6T 光模块需求。", ["海外云客户需求", "光模块价格周期"]),
  company("co-iflytek", "002230", "SZSE", "科大讯飞", "China", "China", "map-china-domestic-substitution", categoryId("china", "ai-applications-software"), "国产大模型和 AI 应用平台。", "科大讯飞代表国内 AI 应用和大模型商业化方向。", ["商业化速度", "算力成本", "竞争格局"]),
];

export const aiNarrativesSeed: AiNarrative[] = [
  ["ai-capex-supercycle", "AI capex supercycle", "Multi-year hyperscaler and sovereign investment cycle into AI compute, networking, power, and datacenter capacity.", "accelerating"],
  ["hbm-shortage", "HBM shortage", "High-bandwidth memory scarcity as accelerator performance becomes memory-bandwidth constrained.", "accelerating"],
  ["inference-demand-explosion", "Inference demand explosion", "Shift from training clusters to persistent inference workloads across consumer, enterprise, and agentic software.", "emerging"],
  ["datacenter-power-bottleneck", "Datacenter power bottleneck", "Power availability, cooling, and grid interconnect becoming constraints on AI datacenter deployment.", "accelerating"],
  ["sovereign-ai", "Sovereign AI", "National and regional push to own AI compute, data, models, and infrastructure.", "emerging"],
  ["china-domestic-substitution", "China domestic substitution", "国产替代 cycle across AI chips, equipment, foundry, packaging, servers, optics, and software.", "accelerating"],
  ["ai-agent-infrastructure", "AI agent infrastructure", "Infrastructure and software stack required for AI agents, tool use, and operational AI systems.", "emerging"],
].map(([slug, name, description, status]) => ({
  id: `nar-${slug}`,
  slug,
  name,
  description,
  status,
  regime_relevance: "Tracked as an active AI capital-cycle narrative.",
  risks: ["valuation crowding", "execution delays", "cycle digestion"],
}));

export const aiNarrativeCompaniesSeed: AiNarrativeCompany[] = [
  ["ai-capex-supercycle", "co-nvda", "winner"],
  ["ai-capex-supercycle", "co-tsm", "bottleneck_supplier"],
  ["hbm-shortage", "co-sk-hynix", "winner"],
  ["hbm-shortage", "co-mu", "winner"],
  ["datacenter-power-bottleneck", "co-vrt", "winner"],
  ["datacenter-power-bottleneck", "co-etn", "second_order_beneficiary"],
  ["ai-agent-infrastructure", "co-pltr", "winner"],
  ["china-domestic-substitution", "co-cambricon", "winner"],
  ["china-domestic-substitution", "co-smic", "bottleneck_supplier"],
  ["china-domestic-substitution", "co-naura", "winner"],
  ["china-domestic-substitution", "co-innolight", "second_order_beneficiary"],
  ["ai-agent-infrastructure", "co-iflytek", "regional_beneficiary"],
].map(([narrativeSlug, companyId, role]) => ({
  narrative_id: `nar-${narrativeSlug}`,
  company_id: companyId,
  role,
  notes: "MVP mapping for narrative exposure.",
}));

const relationshipRows: Array<[string, string, string, string, number]> = [
  ["co-nvda", "co-tsm", "dependency", "NVIDIA advanced accelerators depend on TSMC leading-edge manufacturing.", 5],
  ["co-amd", "co-tsm", "dependency", "AMD accelerators depend on TSMC advanced-node supply.", 5],
  ["co-nvda", "co-sk-hynix", "dependency", "NVIDIA accelerator supply is tied to HBM availability.", 4],
  ["co-anet", "co-nvda", "beneficiary", "AI accelerator clusters increase high-speed networking demand.", 4],
  ["co-vrt", "co-nvda", "second_order_beneficiary", "Higher-density AI racks increase power and cooling demand.", 4],
  ["co-cambricon", "co-smic", "dependency", "国产 AI 芯片长期依赖国内晶圆制造能力提升。", 4],
  ["co-naura", "co-smic", "supplier", "国产设备平台服务国内晶圆厂扩产和设备替代。", 4],
  ["co-jcet", "co-cambricon", "beneficiary", "AI 芯片复杂度提升带动先进封装需求。", 3],
  ["co-innolight", "co-inspur", "beneficiary", "AI 服务器集群拉动高速光模块需求。", 4],
];

export const aiCompanyRelationshipsSeed: AiCompanyRelationship[] = relationshipRows.map(([source_company_id, target_company_id, relationship_type, description, strength], index) => ({
  id: `rel-${index + 1}`,
  source_company_id,
  target_company_id,
  relationship_type,
  description,
  strength: Number(strength),
  evidence: "Seeded MVP industry-chain relationship.",
}));

const thesisRows: Array<[string, string, number]> = [
  ["co-nvda", "AI compute platform remains the control point", 4],
  ["co-tsm", "Advanced foundry is the AI supply chain bottleneck", 4],
  ["co-vrt", "Power and cooling are second-order AI capex winners", 4],
  ["co-pltr", "Operational AI software monetizes enterprise workflows", 3],
  ["co-cambricon", "国产 AI 芯片稀缺性需要收入兑现验证", 3],
  ["co-naura", "国产设备平台受益于半导体主权资本开支", 4],
  ["co-innolight", "高速光模块是 AI 网络升级高弹性环节", 4],
];

export const aiThesesSeed: AiThesis[] = thesisRows.map(([company_id, title, confidence], index) => {
  const node = aiCompanyNodesSeed.find((item) => item.id === company_id);

  return {
    id: `thesis-${index + 1}`,
    company_id,
    title: String(title),
    thesis: node?.thesis ?? String(title),
    status: "active",
    confidence: Number(confidence),
    time_horizon: "12-24 months",
  };
});
