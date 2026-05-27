export type BilingualTerm = {
  primary: string;
  secondary?: string;
};

const layerTerms: Record<string, BilingualTerm> = {
  "gpu-accelerators": {
    primary: "AI Chips & Accelerators",
    secondary: "AI芯片与加速器",
  },
  accelerators: {
    primary: "AI Chips & Accelerators",
    secondary: "AI芯片与加速器",
  },
  "ai-chips": {
    primary: "AI Chips & Accelerators",
    secondary: "AI芯片与加速器",
  },
  "hbm-memory": {
    primary: "HBM / Memory",
    secondary: "高带宽存储 / 存储器",
  },
  foundry: {
    primary: "Foundry",
    secondary: "晶圆代工",
  },
  "semi-equipment": {
    primary: "Semiconductor Equipment",
    secondary: "半导体设备",
  },
  "eda-ip-design": {
    primary: "EDA / IP / Silicon Design",
    secondary: "EDA / IP / 芯片设计",
  },
  "semiconductor-equipment": {
    primary: "Semiconductor Equipment",
    secondary: "半导体设备",
  },
  "advanced-packaging": {
    primary: "Advanced Packaging / Testing",
    secondary: "先进封装 / 测试",
  },
  "advanced-packaging-osat": {
    primary: "Advanced Packaging / OSAT",
    secondary: "先进封装 / 封测",
  },
  "networking-optical": {
    primary: "Networking / Optical / CPO",
    secondary: "网络 / 光互联 / 共封装光学",
  },
  "optical-cpo": {
    primary: "Optical Networking / CPO",
    secondary: "高速光互联 / 共封装光学",
  },
  "datacenter-power": {
    primary: "Datacenter Power / Cooling / Colocation",
    secondary: "数据中心电力 / 散热 / 托管",
  },
  "cloud-hyperscalers": {
    primary: "Cloud / Hyperscalers",
    secondary: "云计算 / 超大规模云厂商",
  },
  "software-data": {
    primary: "AI Software / Data Platform",
    secondary: "AI软件 / 数据平台",
  },
  "ai-software-saas": {
    primary: "AI Software / SaaS",
    secondary: "AI软件 / SaaS",
  },
  "ai-applications": {
    primary: "AI Applications",
    secondary: "AI应用",
  },
  "ai-applications-software": {
    primary: "AI Applications / Software",
    secondary: "AI应用 / 软件",
  },
  "ai-servers": {
    primary: "AI Servers",
    secondary: "AI服务器",
  },
  "pcb-interconnect": {
    primary: "PCB / High-Speed Interconnect",
    secondary: "PCB / 高速互联",
  },
  "robotics-automation": {
    primary: "Robotics / Automation",
    secondary: "机器人 / 自动化",
  },
};

const narrativeTerms: Record<string, BilingualTerm> = {
  "ai capex": {
    primary: "AI Capex Supercycle",
    secondary: "AI资本开支周期",
  },
  "ai capex supercycle": {
    primary: "AI Capex Supercycle",
    secondary: "AI资本开支周期",
  },
  "hbm shortage": {
    primary: "HBM Shortage",
    secondary: "高带宽存储短缺",
  },
  hbm: {
    primary: "HBM",
    secondary: "高带宽存储",
  },
  inference: {
    primary: "Inference Demand",
    secondary: "推理需求",
  },
  "inference demand": {
    primary: "Inference Demand Explosion",
    secondary: "推理需求爆发",
  },
  "inference demand explosion": {
    primary: "Inference Demand Explosion",
    secondary: "推理需求爆发",
  },
  "datacenter power": {
    primary: "Datacenter Power Bottleneck",
    secondary: "数据中心电力瓶颈",
  },
  "datacenter power bottleneck": {
    primary: "Datacenter Power Bottleneck",
    secondary: "数据中心电力瓶颈",
  },
  "optical networking": {
    primary: "Optical Networking",
    secondary: "高速光互联",
  },
  robotics: {
    primary: "Robotics Renaissance",
    secondary: "机器人复兴",
  },
  "cloud ai": {
    primary: "Cloud AI",
    secondary: "云端AI",
  },
  "sovereign ai": {
    primary: "Sovereign AI",
    secondary: "主权AI",
  },
  "advanced packaging": {
    primary: "Advanced Packaging Constraint",
    secondary: "先进封装约束",
  },
  "ai agent infrastructure": {
    primary: "AI Agent Infrastructure",
    secondary: "AI智能体基础设施",
  },
  "ai-agent-infrastructure": {
    primary: "AI Agent Infrastructure",
    secondary: "AI智能体基础设施",
  },
  "china domestic substitution": {
    primary: "China Domestic Substitution",
    secondary: "国产替代",
  },
  "china-domestic-substitution": {
    primary: "China Domestic Substitution",
    secondary: "国产替代",
  },
  cybersecurity: {
    primary: "Cybersecurity / AI Infrastructure",
    secondary: "网络安全 / AI基础设施",
  },
};

const companyTerms: Record<string, string> = {
  TSMC: "台积电",
  "SK Hynix": "SK海力士",
  "Tokyo Electron": "东京电子",
  ASML: "阿斯麦",
  Kioxia: "铠侠",
  Advantest: "爱德万测试",
  Disco: "迪思科",
  Amkor: "安靠",
  JCET: "长电科技",
  "Tongfu Microelectronics": "通富微电",
  "ASM International": "ASM国际",
  "BE Semiconductor": "BESI",
  "Schneider Electric": "施耐德电气",
  Siemens: "西门子",
  ABB: "ABB",
  "Yaskawa Electric": "安川电机",
  "Rockwell Automation": "罗克韦尔自动化",
  "Johnson Controls": "江森自控",
  "Trane Technologies": "特灵科技",
  "Samsung Electronics": "三星电子",
  "ASE Technology": "日月光",
  MediaTek: "联发科",
  Quanta: "广达",
  Wistron: "纬创",
  Wiwynn: "纬颖",
  FANUC: "发那科",
  Keyence: "基恩士",
};

export const abbreviationTerms: BilingualTerm[] = [
  { primary: "GPU", secondary: "图形处理器" },
  { primary: "ASIC", secondary: "专用集成电路" },
  { primary: "HBM", secondary: "高带宽存储" },
  { primary: "CPO", secondary: "共封装光学" },
  { primary: "CoWoS", secondary: "晶圆级先进封装" },
  { primary: "TSV", secondary: "硅通孔" },
  { primary: "EUV", secondary: "极紫外光刻" },
];

const normalize = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export function getLayerTerm(idOrName: string): BilingualTerm {
  const direct = layerTerms[idOrName] ?? layerTerms[normalize(idOrName)];
  return direct ?? { primary: idOrName };
}

export function getNarrativeTerm(idOrName: string): BilingualTerm {
  const normalized = normalize(idOrName);
  return narrativeTerms[normalized] ?? { primary: idOrName };
}

export function getCompanyDisplayName(name: string): BilingualTerm {
  const secondary = companyTerms[name];

  return {
    primary: name,
    secondary:
      secondary && normalize(secondary) !== normalize(name) ? secondary : undefined,
  };
}

export function formatBilingual(term: BilingualTerm): string {
  return term.secondary ? `${term.primary} (${term.secondary})` : term.primary;
}
