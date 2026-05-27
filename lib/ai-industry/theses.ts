import "server-only";

import { createAiIndustryReadClient } from "@/lib/ai-industry/client";
import {
  aiThematicThesesSeed,
  aiThesesSeed,
} from "@/lib/ai-industry/seed";
import type {
  AiCompanyNode,
  AiNarrative,
  AiThesis,
  AiThesisDetail,
} from "@/lib/ai-industry/types";

export async function listAiTheses(): Promise<AiThesis[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return aiThesesSeed;
  }

  try {
    const { data, error } = await supabase
      .from("ai_theses")
      .select("id,company_id,slug,title,thesis,status,confidence,time_horizon,updated_at")
      .order("confidence", { ascending: false });

    if (error) {
      return aiThesesSeed;
    }

    return (data ?? []) as AiThesis[];
  } catch {
    return aiThesesSeed;
  }
}

const thesisSelect =
  "id,company_id,slug,title,thesis,status,confidence,time_horizon,updated_at";

const companySelect =
  "id,ticker,exchange,name,region,country,map_id,category_id,ai_narrative,thesis,beneficiaries,dependency_relationships,market_regime_relevance,valuation_context,earnings_memory,is_core";

const narrativeSelect = "id,slug,name,description,status,regime_relevance,risks";

export async function listAiThematicTheses(): Promise<AiThesisDetail[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return aiThematicThesesSeed;
  }

  try {
    const { data: theses, error } = await supabase
      .from("ai_theses")
      .select(thesisSelect)
      .not("slug", "is", null)
      .order("updated_at", { ascending: false });

    if (error) {
      return aiThematicThesesSeed;
    }

    return hydrateTheses((theses ?? []) as AiThesis[]);
  } catch {
    return aiThematicThesesSeed;
  }
}

export async function getAiThematicThesis(
  idOrSlug: string,
): Promise<AiThesisDetail | null> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return (
      aiThematicThesesSeed.find(
        (thesis) => thesis.id === idOrSlug || thesis.slug === idOrSlug,
      ) ?? null
    );
  }

  try {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const query = supabase.from("ai_theses").select(thesisSelect);
    const { data, error } = isUuid
      ? await query.eq("id", idOrSlug).maybeSingle()
      : await query.eq("slug", idOrSlug).maybeSingle();

    if (error || !data) {
      return (
        aiThematicThesesSeed.find(
          (thesis) => thesis.id === idOrSlug || thesis.slug === idOrSlug,
        ) ?? null
      );
    }

    const [detail] = await hydrateTheses([data as AiThesis]);
    return detail ?? null;
  } catch {
    return (
      aiThematicThesesSeed.find(
        (thesis) => thesis.id === idOrSlug || thesis.slug === idOrSlug,
      ) ?? null
    );
  }
}

async function hydrateTheses(theses: AiThesis[]): Promise<AiThesisDetail[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase || !theses.length) {
    return aiThematicThesesSeed;
  }

  const thesisIds = theses.map((thesis) => thesis.id);

  const [{ data: companyLinks }, { data: narrativeLinks }, { data: evidence }] =
    await Promise.all([
      supabase
        .from("ai_thesis_companies")
        .select(`thesis_id,company:ai_company_nodes(${companySelect})`)
        .in("thesis_id", thesisIds),
      supabase
        .from("ai_thesis_narratives")
        .select(`thesis_id,narrative:ai_narratives(${narrativeSelect})`)
        .in("thesis_id", thesisIds),
      supabase
        .from("ai_thesis_evidence")
        .select(
          `id,thesis_id,evidence_type,summary,source_type,confidence_impact,event_date,related_company_id,related_narrative_id,related_company:ai_company_nodes(${companySelect}),related_narrative:ai_narratives(${narrativeSelect})`,
        )
        .in("thesis_id", thesisIds)
        .order("event_date", { ascending: false }),
    ]);

  return theses.map((thesis) => ({
    ...thesis,
    companies: ((companyLinks ?? []) as Array<Record<string, unknown>>)
      .filter((link) => link.thesis_id === thesis.id)
      .map((link) => link.company)
      .filter((company): company is AiCompanyNode => Boolean(company)),
    narratives: ((narrativeLinks ?? []) as Array<Record<string, unknown>>)
      .filter((link) => link.thesis_id === thesis.id)
      .map((link) => link.narrative)
      .filter((narrative): narrative is AiNarrative => Boolean(narrative)),
    evidence: ((evidence ?? []) as Array<Record<string, unknown>>)
      .filter((item) => item.thesis_id === thesis.id)
      .map((item) => ({
        id: String(item.id),
        thesis_id: String(item.thesis_id),
        evidence_type:
          item.evidence_type === "contradict" ? "contradict" : "support",
        summary: String(item.summary ?? ""),
        source_type: String(item.source_type ?? ""),
        confidence_impact: Number(item.confidence_impact ?? 0),
        event_date: String(item.event_date ?? ""),
        related_company_id: item.related_company_id
          ? String(item.related_company_id)
          : null,
        related_narrative_id: item.related_narrative_id
          ? String(item.related_narrative_id)
          : null,
        related_company: (item.related_company as AiCompanyNode | null) ?? null,
        related_narrative: (item.related_narrative as AiNarrative | null) ?? null,
      })),
  }));
}
