import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MorningBrief } from "@/lib/agent/morningBrief";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseServerConfig,
} from "@/lib/env";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const TABLE_NAME = "research_memory";
const TIME_ZONE = "Asia/Shanghai";

export type ResearchMemoryCategory =
  | "daily_observation"
  | "risk_change"
  | "sector_state"
  | "stock_state"
  | "market_regime"
  | "narrative_evolution"
  | "thesis_update"
  | "earnings_memory"
  | "supply_chain_change";

export type ResearchMemoryItem = {
  id: string;
  date: string;
  category: ResearchMemoryCategory;
  symbol: string | null;
  title: string;
  content: string;
  tags: string[];
  company_id?: string | null;
  narrative_id?: string | null;
  thesis_id?: string | null;
  memory_type?: string | null;
  created_at: string;
};

export type ResearchMemoryInput = {
  date?: string;
  category: ResearchMemoryCategory;
  symbol?: string | null;
  title: string;
  content: string;
  tags?: string[];
  companyId?: string | null;
  narrativeId?: string | null;
  thesisId?: string | null;
  memoryType?: string | null;
};

export type ResearchMemorySnapshot = {
  last3Days: ResearchMemoryItem[];
  last7Days: ResearchMemoryItem[];
  last30Days: ResearchMemoryItem[];
};

export type ResearchMemoryFilters = {
  symbol?: string;
  category?: ResearchMemoryCategory;
  tag?: string;
  query?: string;
};

type ResearchMemoryPayload = {
  date: string;
  category: ResearchMemoryCategory;
  symbol: string | null;
  title: string;
  content: string;
  tags: string[];
  company_id: string | null;
  narrative_id: string | null;
  thesis_id: string | null;
  memory_type: string | null;
};

type MemoryLinkContext = {
  companiesByTicker: Map<string, string>;
  narrativesBySlug: Map<string, string>;
  thesesByCompanyId: Map<string, string>;
};

const researchMemorySelect =
  "id,date,category,symbol,title,content,tags,company_id,narrative_id,thesis_id,memory_type,created_at";

const getDate = (value = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

const createServiceClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getDate(date);
};

export async function saveResearchMemory(
  item: ResearchMemoryInput,
): Promise<ResearchMemoryItem | null> {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        date: item.date ?? getDate(),
        category: item.category,
        symbol: item.symbol ?? null,
        title: item.title,
        content: item.content,
        tags: item.tags ?? [],
        company_id: item.companyId ?? null,
        narrative_id: item.narrativeId ?? null,
        thesis_id: item.thesisId ?? null,
        memory_type: item.memoryType ?? null,
      })
      .select(researchMemorySelect)
      .single();

    if (error) {
      return null;
    }

    return data as ResearchMemoryItem;
  } catch {
    return null;
  }
}

export async function saveResearchMemories(
  items: ResearchMemoryInput[],
): Promise<ResearchMemoryItem[]> {
  if (!hasSupabaseServerConfig() || !items.length) {
    return [];
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return [];
    }

    const today = getDate();
    const payload: ResearchMemoryPayload[] = items.map((item) => ({
      date: item.date ?? today,
      category: item.category,
      symbol: item.symbol ?? null,
      title: item.title,
      content: item.content,
      tags: item.tags ?? [],
      company_id: item.companyId ?? null,
      narrative_id: item.narrativeId ?? null,
      thesis_id: item.thesisId ?? null,
      memory_type: item.memoryType ?? null,
    }));
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select(researchMemorySelect);

    if (error) {
      return [];
    }

    return (data ?? []) as ResearchMemoryItem[];
  } catch {
    return [];
  }
}

export async function refreshResearchMemoryForDate(
  date: string,
  items: ResearchMemoryInput[],
): Promise<ResearchMemoryItem[]> {
  if (!hasSupabaseServerConfig() || !items.length) {
    return [];
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return [];
    }

    const payload: ResearchMemoryPayload[] = items.map((item) => ({
      date,
      category: item.category,
      symbol: item.symbol ?? null,
      title: item.title,
      content: item.content,
      tags: item.tags ?? [],
      company_id: item.companyId ?? null,
      narrative_id: item.narrativeId ?? null,
      thesis_id: item.thesisId ?? null,
      memory_type: item.memoryType ?? null,
    }));
    const { data, error } = await supabase.rpc(
      "refresh_research_memory_for_date",
      {
        target_date: date,
        items: payload,
      },
    );

    if (error) {
      return [];
    }

    return (data ?? []) as ResearchMemoryItem[];
  } catch {
    return [];
  }
}

const queryResearchMemory = async (
  supabase: SupabaseClient,
  filters: ResearchMemoryFilters = {},
): Promise<ResearchMemoryItem[]> => {
  let query = supabase
    .from(TABLE_NAME)
    .select(researchMemorySelect)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (filters.symbol) {
    query = query.eq("symbol", filters.symbol.trim().toUpperCase());
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag]);
  }

  if (filters.query) {
    const safeQuery = filters.query.replaceAll("%", "").replaceAll(",", " ");
    query = query.or(
      `title.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%,symbol.ilike.%${safeQuery}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return (data ?? []) as ResearchMemoryItem[];
};

export async function listResearchMemory(
  filters: ResearchMemoryFilters = {},
): Promise<ResearchMemoryItem[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    return queryResearchMemory(supabase, filters);
  } catch {
    return [];
  }
}

async function listResearchMemoryWithServiceRole(
  filters: ResearchMemoryFilters = {},
): Promise<ResearchMemoryItem[]> {
  if (!hasSupabaseServerConfig()) {
    return [];
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return [];
    }

    return queryResearchMemory(supabase, filters);
  } catch {
    return [];
  }
}

export async function getRecentResearchMemory(): Promise<ResearchMemorySnapshot> {
  const [last3Days, last7Days, last30Days] = await Promise.all([
    listResearchMemoryWithServiceRole({ query: "" }).then((items) =>
      items.filter((item) => item.date >= daysAgo(3)),
    ),
    listResearchMemoryWithServiceRole({ query: "" }).then((items) =>
      items.filter((item) => item.date >= daysAgo(7)),
    ),
    listResearchMemoryWithServiceRole({ query: "" }).then((items) =>
      items.filter((item) => item.date >= daysAgo(30)),
    ),
  ]);

  return {
    last3Days,
    last7Days,
    last30Days,
  };
}

const getMemoryLinkContext = async (): Promise<MemoryLinkContext> => {
  const empty = {
    companiesByTicker: new Map<string, string>(),
    narrativesBySlug: new Map<string, string>(),
    thesesByCompanyId: new Map<string, string>(),
  };

  if (!hasSupabaseServerConfig()) {
    return empty;
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return empty;
    }

    const [{ data: companies }, { data: narratives }, { data: theses }] =
      await Promise.all([
        supabase.from("ai_company_nodes").select("id,ticker,exchange"),
        supabase.from("ai_narratives").select("id,slug"),
        supabase.from("ai_theses").select("id,company_id,confidence"),
      ]);
    const companiesByTicker = new Map<string, string>();

    (companies ?? []).forEach((company) => {
      companiesByTicker.set(String(company.ticker).toUpperCase(), company.id);
      companiesByTicker.set(
        `${String(company.exchange).toUpperCase()}:${String(company.ticker).toUpperCase()}`,
        company.id,
      );
    });
    const thesesByCompanyId = new Map<string, string>();

    (theses ?? [])
      .sort((a, b) => Number(b.confidence ?? 0) - Number(a.confidence ?? 0))
      .forEach((thesis) => {
        const companyId = String(thesis.company_id);

        // Keep the first thesis after descending confidence sort: strongest link wins.
        if (!thesesByCompanyId.has(companyId)) {
          thesesByCompanyId.set(companyId, thesis.id);
        }
      });

    return {
      companiesByTicker,
      narrativesBySlug: new Map(
        (narratives ?? []).map((narrative) => [
          String(narrative.slug),
          narrative.id,
        ]),
      ),
      thesesByCompanyId,
    };
  } catch {
    return empty;
  }
};

const firstMatchingCompanyId = (
  content: string,
  context: MemoryLinkContext,
): string | null => {
  const upper = content.toUpperCase();

  for (const [ticker, id] of context.companiesByTicker) {
    const plainTicker = ticker.includes(":") ? ticker.split(":")[1] : ticker;

    if (plainTicker && upper.includes(plainTicker)) {
      return id;
    }
  }

  return null;
};

const narrativeSlugForContent = (content: string): string | null => {
  const lower = content.toLowerCase();

  if (lower.includes("hbm")) {
    return "hbm-shortage";
  }

  if (lower.includes("power") || lower.includes("电力") || lower.includes("cooling")) {
    return "datacenter-power-bottleneck";
  }

  if (lower.includes("china") || lower.includes("国产") || lower.includes("sovereign")) {
    return lower.includes("china") || lower.includes("国产")
      ? "china-domestic-substitution"
      : "sovereign-ai";
  }

  if (lower.includes("agent")) {
    return "ai-agent-infrastructure";
  }

  if (lower.includes("inference")) {
    return "inference-demand-explosion";
  }

  if (lower.includes("capex") || lower.includes("datacenter")) {
    return "ai-capex-supercycle";
  }

  return null;
};

const linkedItem = (
  item: ResearchMemoryInput,
  context: MemoryLinkContext,
): ResearchMemoryInput => {
  const companyId =
    item.companyId ?? firstMatchingCompanyId(`${item.title} ${item.content}`, context);
  const narrativeSlug = narrativeSlugForContent(`${item.title} ${item.content}`);
  const narrativeId = item.narrativeId ?? (narrativeSlug ? context.narrativesBySlug.get(narrativeSlug) : null);

  return {
    ...item,
    companyId,
    narrativeId,
    thesisId:
      item.thesisId ?? (companyId ? context.thesesByCompanyId.get(companyId) : null),
  };
};

export async function saveDailyAIObservations(
  brief: MorningBrief,
): Promise<ResearchMemoryItem[]> {
  const date = getDate(new Date(brief.generatedAt));
  const context = await getMemoryLinkContext();
  const stockItems = brief.watchlistMoves.slice(0, 5).map((move) => {
    const symbol = move.match(/^([A-Z.-]+)/)?.[1] ?? null;

    return {
      date,
      category: "stock_state" as const,
      symbol,
      title: symbol ? `${symbol} 重点股票状态` : "重点股票状态",
      content: move,
      tags: ["watchlist", "stock"],
      memoryType: "stock_state",
    };
  });
  const rawItems: ResearchMemoryInput[] = [
    {
      date,
      category: "daily_observation",
      title: "每日市场观察",
      content: brief.oneLineSummary,
      tags: ["market", "daily"],
      memoryType: "daily_observation",
    },
    ...brief.globalAiChainChanges.slice(0, 5).map((content) => ({
      date,
      category: "supply_chain_change" as const,
      title: "Global AI Chain Changes",
      content,
      tags: ["global-ai", "supply-chain"],
      memoryType: "supply_chain_change",
    })),
    ...brief.chinaDomesticSubstitutionChanges.slice(0, 5).map((content) => ({
      date,
      category: "supply_chain_change" as const,
      title: "China 国产替代 Changes",
      content,
      tags: ["china", "国产替代", "supply-chain"],
      memoryType: "supply_chain_change",
      narrativeId: context.narrativesBySlug.get("china-domestic-substitution"),
    })),
    ...brief.narrativeAccelerationFading.slice(0, 6).map((content) => ({
      date,
      category: "narrative_evolution" as const,
      title: "Narrative Acceleration / Fading",
      content,
      tags: ["narrative", "ai-cycle"],
      memoryType: "narrative_evolution",
    })),
    ...brief.thesisReinforcementContradiction.slice(0, 6).map((content) => ({
      date,
      category: "thesis_update" as const,
      title: "Thesis Reinforcement / Contradiction",
      content,
      tags: ["thesis", "ai-cycle"],
      memoryType: "thesis_update",
    })),
    ...brief.aiInfrastructureRiskSignals.slice(0, 5).map((content) => ({
      date,
      category: "risk_change" as const,
      title: "AI Infrastructure Risk Signals",
      content,
      tags: ["risk", "infrastructure"],
      memoryType: "risk_change",
    })),
    ...brief.aiCapexDatacenterSignals.slice(0, 5).map((content) => ({
      date,
      category: "market_regime" as const,
      title: "AI Capex and Datacenter Signals",
      content,
      tags: ["capex", "datacenter", "market-regime"],
      memoryType: "market_regime",
      narrativeId: context.narrativesBySlug.get("ai-capex-supercycle"),
    })),
    ...brief.importantCompanyMemoryUpdates.slice(0, 8).map((content) => ({
      date,
      category: "earnings_memory" as const,
      title: "Important Company Memory Updates",
      content,
      tags: ["company-memory", "earnings-memory"],
      memoryType: "earnings_memory",
    })),
    {
      date,
      category: "sector_state",
      title: "AI 主线状态",
      content: brief.aiThemeStatus,
      tags: ["ai", "sector", "AI 主线"],
      memoryType: "sector_state",
    },
    {
      date,
      category: "sector_state",
      title: "半导体状态",
      content: brief.semiconductorStatus,
      tags: ["semiconductor", "sector", "半导体"],
      memoryType: "sector_state",
    },
    {
      date,
      category: "sector_state",
      title: "软件股状态",
      content: brief.softwareStatus,
      tags: ["software", "sector", "软件股"],
      memoryType: "sector_state",
    },
    ...brief.riskNotes.slice(0, 5).map((risk) => ({
      date,
      category: "risk_change" as const,
      title: "风险变化",
      content: risk,
      tags: ["risk", "风险"],
      memoryType: "risk_change",
    })),
    ...stockItems,
  ];
  const items = rawItems.map((item) => linkedItem(item, context));

  return refreshResearchMemoryForDate(date, items);
}
