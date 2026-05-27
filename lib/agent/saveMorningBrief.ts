import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { MorningBrief } from "@/lib/agent/morningBrief";
import { generateMorningBrief } from "@/lib/agent/morningBrief";
import { saveDailyAIObservations } from "@/lib/agent/researchMemory";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseServerConfig,
} from "@/lib/env";

const TIME_ZONE = "Asia/Shanghai";
const TABLE_NAME = "morning_briefs";

export type SavedMorningBrief = {
  id: string;
  date: string;
  title: string;
  content_markdown: string;
  summary: string;
  created_at: string;
};

type SaveMorningBriefOptions = {
  forceRegenerate?: boolean;
};

const formatPercent = (value: number | null): string =>
  value === null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export const getShanghaiDate = (value = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);

export function morningBriefToMarkdown(brief: MorningBrief): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((line) => `- ${line}`)].join("\n");

  return [
    "# AI Morning Brief",
    "",
    `生成时间：${new Date(brief.generatedAt).toLocaleString("zh-CN", {
      timeZone: TIME_ZONE,
    })}`,
    "",
    `> ${brief.oneLineSummary}`,
    "",
    section(
      "指数表现",
      brief.indexes.map(
        (item) =>
          `${item.label}：${item.value}，涨跌幅 ${formatPercent(item.changePercent)}，数据状态 ${item.dataStatus}`,
      ),
    ),
    "",
    section(
      "利率与宏观",
      brief.macro.map(
        (item) =>
          `${item.label}：${item.value}，涨跌幅 ${formatPercent(item.changePercent)}，数据状态 ${item.dataStatus}`,
      ),
    ),
    "",
    section("过去 7 天市场变化", brief.last7DaysChanges),
    "",
    section("AI 市场状态变化趋势", brief.marketStateTrends),
    "",
    section("AI 主线状态", [brief.aiThemeStatus]),
    "",
    section("半导体状态", [brief.semiconductorStatus]),
    "",
    section("软件股状态", [brief.softwareStatus]),
    "",
    section("Watchlist 异动", brief.watchlistMoves),
    "",
    section("财报提醒", brief.earningsReminders),
    "",
    section("风险提示", brief.riskNotes),
    "",
    section("明日观察重点", brief.tomorrowFocus),
    "",
    brief.disclaimer,
  ].join("\n");
}

const getSectionLines = (markdown: string, title: string): string[] => {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(
    new RegExp(`## ${escapedTitle}\\n([\\s\\S]*?)(?=\\n## |\\n仅供研究参考|$)`),
  );

  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim().replace(/^- /, ""))
    .filter(Boolean);
};

const getSectionText = (
  markdown: string,
  title: string,
  fallback: string,
): string => getSectionLines(markdown, title)[0] ?? fallback;

const emptyQuote = (
  symbol: string,
  label: string,
  group: "index" | "macro",
) => ({
  symbol,
  label,
  value: "已归档",
  changePercent: null,
  dataStatus: "missing" as const,
  group,
});

export function savedMorningBriefToBrief(
  saved: SavedMorningBrief,
): MorningBrief {
  const content = saved.content_markdown;
  const generatedAt = saved.created_at;

  return {
    oneLineSummary: saved.summary,
    indexes: [
      emptyQuote("SPY", "SPY 标普500 ETF", "index"),
      emptyQuote("QQQ", "QQQ 纳斯达克100 ETF", "index"),
      emptyQuote("DIA", "DIA 道琼斯 ETF", "index"),
      emptyQuote("IWM", "IWM 罗素2000 ETF", "index"),
      emptyQuote("SOXX", "SOXX 半导体 ETF", "index"),
      emptyQuote("^VIX", "VIX 波动率", "index"),
    ],
    macro: [
      emptyQuote("^TNX", "10Y Treasury", "macro"),
      emptyQuote("DX-Y.NYB", "DXY 美元指数", "macro"),
      emptyQuote("CL=F", "Oil WTI 原油", "macro"),
      emptyQuote("BTC-USD", "BTC 比特币", "macro"),
    ],
    last7DaysChanges: getSectionLines(content, "过去 7 天市场变化"),
    marketStateTrends: getSectionLines(content, "AI 市场状态变化趋势"),
    aiThemeStatus: getSectionText(content, "AI 主线状态", saved.summary),
    semiconductorStatus: getSectionText(content, "半导体状态", saved.summary),
    softwareStatus: getSectionText(content, "软件股状态", saved.summary),
    watchlistMoves: getSectionLines(content, "Watchlist 异动"),
    earningsReminders: getSectionLines(content, "财报提醒"),
    riskNotes: getSectionLines(content, "风险提示"),
    tomorrowFocus: getSectionLines(content, "明日观察重点"),
    disclaimer: "仅供研究参考，不构成投资建议。",
    generatedAt,
  };
}

export function emptyMorningBrief(): MorningBrief {
  const saved: SavedMorningBrief = {
    id: "",
    date: getShanghaiDate(),
    title: "AI Morning Brief",
    content_markdown: "",
    summary: "今日尚未生成 Morning Brief。请登录后手动生成，或等待受保护的定时任务写入归档。",
    created_at: new Date().toISOString(),
  };

  return savedMorningBriefToBrief(saved);
}

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

export async function getMorningBriefByDate(
  date: string,
): Promise<SavedMorningBrief | null> {
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
      .select("id,date,title,content_markdown,summary,created_at")
      .eq("date", date)
      .maybeSingle();

    if (error) {
      return null;
    }

    return (data as SavedMorningBrief | null) ?? null;
  } catch {
    return null;
  }
}

export async function hasTodayMorningBrief(): Promise<boolean> {
  return Boolean(await getMorningBriefByDate(getShanghaiDate()));
}

export async function getLatestMorningBrief(): Promise<SavedMorningBrief | null> {
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
      .select("id,date,title,content_markdown,summary,created_at")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }

    return (data as SavedMorningBrief | null) ?? null;
  } catch {
    return null;
  }
}

export async function listMorningBriefs(): Promise<SavedMorningBrief[]> {
  if (!hasSupabaseServerConfig()) {
    return [];
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("id,date,title,content_markdown,summary,created_at")
      .order("date", { ascending: false })
      .limit(100);

    if (error) {
      return [];
    }

    return (data ?? []) as SavedMorningBrief[];
  } catch {
    return [];
  }
}

export async function saveMorningBrief(
  brief: MorningBrief,
): Promise<SavedMorningBrief | null> {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  try {
    const supabase = createServiceClient();

    if (!supabase) {
      return null;
    }

    const date = getShanghaiDate(new Date(brief.generatedAt));
    const payload = {
      date,
      title: `AI Morning Brief ${date}`,
      content_markdown: morningBriefToMarkdown(brief),
      summary: brief.oneLineSummary,
    };
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(payload, { onConflict: "date" })
      .select("id,date,title,content_markdown,summary,created_at")
      .single();

    if (error) {
      return null;
    }

    return data as SavedMorningBrief;
  } catch {
    return null;
  }
}

export async function generateAndSaveMorningBrief(
  options: SaveMorningBriefOptions = {},
): Promise<{
  brief: MorningBrief;
  saved: SavedMorningBrief | null;
  alreadyGenerated: boolean;
}> {
  const today = getShanghaiDate();
  const existing = await getMorningBriefByDate(today);

  if (existing && !options.forceRegenerate) {
    const brief = await generateMorningBrief();

    return {
      brief,
      saved: existing,
      alreadyGenerated: true,
    };
  }

  const brief = await generateMorningBrief({
    forceRefresh: options.forceRegenerate,
  });
  const saved = await saveMorningBrief(brief);
  await saveDailyAIObservations(brief);

  return {
    brief,
    saved,
    alreadyGenerated: false,
  };
}
