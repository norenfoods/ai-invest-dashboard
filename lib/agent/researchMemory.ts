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
  | "stock_state";

export type ResearchMemoryItem = {
  id: string;
  date: string;
  category: ResearchMemoryCategory;
  symbol: string | null;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
};

export type ResearchMemoryInput = {
  date?: string;
  category: ResearchMemoryCategory;
  symbol?: string | null;
  title: string;
  content: string;
  tags?: string[];
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
};

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
      })
      .select("id,date,category,symbol,title,content,tags,created_at")
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
    }));
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select("id,date,category,symbol,title,content,tags,created_at");

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
    .select("id,date,category,symbol,title,content,tags,created_at")
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

export async function saveDailyAIObservations(
  brief: MorningBrief,
): Promise<ResearchMemoryItem[]> {
  const date = getDate(new Date(brief.generatedAt));
  const stockItems = brief.watchlistMoves.slice(0, 5).map((move) => {
    const symbol = move.match(/^([A-Z.-]+)/)?.[1] ?? null;

    return {
      date,
      category: "stock_state" as const,
      symbol,
      title: symbol ? `${symbol} 重点股票状态` : "重点股票状态",
      content: move,
      tags: ["watchlist", "stock"],
    };
  });
  const items: ResearchMemoryInput[] = [
    {
      date,
      category: "daily_observation",
      title: "每日市场观察",
      content: brief.oneLineSummary,
      tags: ["market", "daily"],
    },
    {
      date,
      category: "sector_state",
      title: "AI 主线状态",
      content: brief.aiThemeStatus,
      tags: ["ai", "sector", "AI 主线"],
    },
    {
      date,
      category: "sector_state",
      title: "半导体状态",
      content: brief.semiconductorStatus,
      tags: ["semiconductor", "sector", "半导体"],
    },
    {
      date,
      category: "sector_state",
      title: "软件股状态",
      content: brief.softwareStatus,
      tags: ["software", "sector", "软件股"],
    },
    ...brief.riskNotes.slice(0, 5).map((risk) => ({
      date,
      category: "risk_change" as const,
      title: "风险变化",
      content: risk,
      tags: ["risk", "风险"],
    })),
    ...stockItems,
  ];

  return refreshResearchMemoryForDate(date, items);
}
