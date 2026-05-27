import type {
  AiCompanyNode,
  AiCompanyRelationship,
  AiIndustryCategory,
  AiMarketMap,
  AiNarrative,
  AiNarrativeCompany,
  AiThesis,
  AiThesisDetail,
  AiThesisEvidence,
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
    slug: null,
    title: String(title),
    thesis: node?.thesis ?? String(title),
    status: "active",
    confidence: Number(confidence),
    time_horizon: "12-24 months",
    updated_at: "2026-05-27T00:00:00.000Z",
  };
});

const thematicThesisRows: Array<{
  id: string;
  slug: string;
  title: string;
  thesis: string;
  status: string;
  confidence: number;
  time_horizon: string;
  narratives: string[];
  companies: string[];
}> = [
  {
    id: "thesis-china-domestic-gpu-substitution",
    slug: "china-domestic-gpu-substitution",
    title: "China domestic GPU substitution",
    thesis:
      "China AI infrastructure demand will increasingly route toward domestic accelerators and supporting semiconductor infrastructure as export controls, procurement policy, and sovereign compute priorities make foreign GPU availability less reliable.",
    status: "active",
    confidence: 3,
    time_horizon: "24-36 months",
    narratives: ["nar-china-domestic-substitution", "nar-sovereign-ai"],
    companies: ["co-cambricon", "co-hygon", "co-smic", "co-naura", "co-inspur"],
  },
  {
    id: "thesis-ai-capex-supercycle",
    slug: "ai-capex-supercycle",
    title: "AI capex supercycle",
    thesis:
      "Hyperscalers, sovereign buyers, and AI-native platforms are likely to sustain a multi-year infrastructure buildout across accelerators, networking, foundry, memory, and datacenter physical infrastructure.",
    status: "active",
    confidence: 4,
    time_horizon: "18-36 months",
    narratives: ["nar-ai-capex-supercycle", "nar-sovereign-ai"],
    companies: ["co-nvda", "co-tsm", "co-avgo", "co-anet", "co-vrt"],
  },
  {
    id: "thesis-hbm-shortage-persistence",
    slug: "hbm-shortage-persistence",
    title: "HBM shortage persistence",
    thesis:
      "HBM supply is likely to remain structurally tight because AI accelerator roadmaps keep increasing memory bandwidth requirements faster than high-yield advanced memory and packaging capacity can normalize.",
    status: "active",
    confidence: 4,
    time_horizon: "12-24 months",
    narratives: ["nar-hbm-shortage", "nar-ai-capex-supercycle"],
    companies: ["co-sk-hynix", "co-mu", "co-nvda", "co-tsm"],
  },
  {
    id: "thesis-inference-demand-acceleration",
    slug: "inference-demand-acceleration",
    title: "Inference demand acceleration",
    thesis:
      "Inference workloads should become a larger and more persistent source of AI infrastructure demand as consumer AI, enterprise copilots, search, agents, and vertical applications move from pilots to repeated production usage.",
    status: "watching",
    confidence: 3,
    time_horizon: "12-30 months",
    narratives: ["nar-inference-demand-explosion", "nar-ai-agent-infrastructure"],
    companies: ["co-nvda", "co-amd", "co-anet", "co-pltr", "co-iflytek"],
  },
  {
    id: "thesis-datacenter-power-bottleneck",
    slug: "datacenter-power-bottleneck",
    title: "Datacenter power bottleneck",
    thesis:
      "Power availability, cooling density, and grid interconnect timelines are becoming binding constraints on AI datacenter deployment, shifting incremental value toward electrical and thermal infrastructure suppliers.",
    status: "active",
    confidence: 4,
    time_horizon: "24-48 months",
    narratives: ["nar-datacenter-power-bottleneck", "nar-ai-capex-supercycle"],
    companies: ["co-vrt", "co-etn", "co-nvda", "co-tsm"],
  },
];

export const aiThematicThesesSeed: AiThesisDetail[] = thematicThesisRows.map(
  (row) => ({
    id: row.id,
    company_id: null,
    slug: row.slug,
    title: row.title,
    thesis: row.thesis,
    status: row.status,
    confidence: row.confidence,
    time_horizon: row.time_horizon,
    updated_at: "2026-05-27T00:00:00.000Z",
    companies: row.companies
      .map((companyId) => aiCompanyNodesSeed.find((item) => item.id === companyId))
      .filter((item): item is AiThesisDetail["companies"][number] =>
        Boolean(item),
      ),
    narratives: row.narratives
      .map((narrativeId) => aiNarrativesSeed.find((item) => item.id === narrativeId))
      .filter((item): item is AiThesisDetail["narratives"][number] =>
        Boolean(item),
      ),
    evidence: [],
  }),
);

const evidenceRows: Array<
  Omit<
    AiThesisEvidence,
    "id" | "thesis_id" | "related_company_id" | "related_narrative_id"
  > & {
    thesis_slug: string;
    company_id?: string;
    narrative_id?: string;
  }
> = [
  {
    thesis_slug: "china-domestic-gpu-substitution",
    evidence_type: "support",
    summary:
      "Export controls and sovereign procurement priorities keep domestic AI chips strategically relevant even when performance trails foreign leaders.",
    source_type: "policy",
    confidence_impact: 1,
    event_date: "2026-05-10",
    company_id: "co-cambricon",
    narrative_id: "nar-china-domestic-substitution",
  },
  {
    thesis_slug: "china-domestic-gpu-substitution",
    evidence_type: "contradict",
    summary:
      "Advanced-node access, software ecosystem maturity, and model compatibility remain gating risks for broad domestic GPU adoption.",
    source_type: "supply_chain",
    confidence_impact: -1,
    event_date: "2026-05-12",
    company_id: "co-smic",
    narrative_id: "nar-china-domestic-substitution",
  },
  {
    thesis_slug: "ai-capex-supercycle",
    evidence_type: "support",
    summary:
      "Hyperscaler commentary and supplier backlogs continue to point to elevated AI infrastructure spending across compute, networking, and datacenter buildouts.",
    source_type: "earnings",
    confidence_impact: 1,
    event_date: "2026-05-08",
    company_id: "co-nvda",
    narrative_id: "nar-ai-capex-supercycle",
  },
  {
    thesis_slug: "ai-capex-supercycle",
    evidence_type: "contradict",
    summary:
      "Cloud ROI scrutiny and depreciation pressure could force digestion periods after rapid infrastructure deployment.",
    source_type: "market_signal",
    confidence_impact: -1,
    event_date: "2026-05-15",
    narrative_id: "nar-ai-capex-supercycle",
  },
  {
    thesis_slug: "hbm-shortage-persistence",
    evidence_type: "support",
    summary:
      "Accelerator roadmaps require higher HBM content and qualification cycles limit how quickly incremental supply can serve leading platforms.",
    source_type: "supply_chain",
    confidence_impact: 1,
    event_date: "2026-05-06",
    company_id: "co-sk-hynix",
    narrative_id: "nar-hbm-shortage",
  },
  {
    thesis_slug: "hbm-shortage-persistence",
    evidence_type: "contradict",
    summary:
      "Aggressive memory capex could loosen scarcity if demand growth slows or customers redesign around lower memory intensity.",
    source_type: "capex_plan",
    confidence_impact: -1,
    event_date: "2026-05-18",
    company_id: "co-mu",
    narrative_id: "nar-hbm-shortage",
  },
  {
    thesis_slug: "inference-demand-acceleration",
    evidence_type: "support",
    summary:
      "Production AI features, enterprise agents, and search workloads increase recurring inference traffic beyond one-time training cluster demand.",
    source_type: "product_adoption",
    confidence_impact: 1,
    event_date: "2026-05-11",
    company_id: "co-nvda",
    narrative_id: "nar-inference-demand-explosion",
  },
  {
    thesis_slug: "inference-demand-acceleration",
    evidence_type: "contradict",
    summary:
      "Model efficiency gains and price competition may compress compute intensity per query before volume fully offsets deflation.",
    source_type: "technology",
    confidence_impact: -1,
    event_date: "2026-05-20",
    narrative_id: "nar-inference-demand-explosion",
  },
  {
    thesis_slug: "datacenter-power-bottleneck",
    evidence_type: "support",
    summary:
      "AI rack density and interconnect delays are pushing datacenter customers toward upgraded power distribution, cooling, and grid-facing infrastructure.",
    source_type: "industry_check",
    confidence_impact: 1,
    event_date: "2026-05-09",
    company_id: "co-vrt",
    narrative_id: "nar-datacenter-power-bottleneck",
  },
  {
    thesis_slug: "datacenter-power-bottleneck",
    evidence_type: "contradict",
    summary:
      "Delayed datacenter permits or slower GPU deployment could defer power equipment revenue recognition despite strong long-term need.",
    source_type: "project_risk",
    confidence_impact: -1,
    event_date: "2026-05-19",
    company_id: "co-etn",
    narrative_id: "nar-datacenter-power-bottleneck",
  },
];

export const aiThesisEvidenceSeed: AiThesisDetail["evidence"] =
  evidenceRows.map((row, index) => {
    const thesis = aiThematicThesesSeed.find((item) => item.slug === row.thesis_slug);
    const relatedCompany =
      aiCompanyNodesSeed.find((item) => item.id === row.company_id) ?? null;
    const relatedNarrative =
      aiNarrativesSeed.find((item) => item.id === row.narrative_id) ?? null;

    return {
      id: `thesis-evidence-${index + 1}`,
      thesis_id: thesis?.id ?? row.thesis_slug,
      evidence_type: row.evidence_type,
      summary: row.summary,
      source_type: row.source_type,
      confidence_impact: row.confidence_impact,
      event_date: row.event_date,
      related_company_id: relatedCompany?.id ?? null,
      related_narrative_id: relatedNarrative?.id ?? null,
      related_company: relatedCompany,
      related_narrative: relatedNarrative,
    };
  });

for (const thesis of aiThematicThesesSeed) {
  thesis.evidence = aiThesisEvidenceSeed.filter(
    (evidence) => evidence.thesis_id === thesis.id,
  );
}
