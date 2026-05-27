import "server-only";

import { createAiIndustryReadClient } from "@/lib/ai-industry/client";
import {
  aiCompanyNodesSeed,
  aiCompanyRelationshipsSeed,
  aiIndustryCategoriesSeed,
  aiMarketMapsSeed,
  aiNarrativeCompaniesSeed,
  aiNarrativesSeed,
  aiThesesSeed,
} from "@/lib/ai-industry/seed";
import type {
  AiCompanyDetail,
  AiCompanyNode,
  AiCompanyRelationship,
  AiCompanyWithCategory,
  AiIndustryCategory,
  AiMarketMap,
} from "@/lib/ai-industry/types";

const companySelect =
  "id,ticker,exchange,name,region,country,map_id,category_id,ai_narrative,thesis,beneficiaries,dependency_relationships,market_regime_relevance,valuation_context,earnings_memory,is_core";

export async function listAiCompanies(): Promise<AiCompanyWithCategory[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return aiCompanyNodesSeed.map(withSeedMapAndCategory);
  }

  try {
    const { data, error } = await supabase
      .from("ai_company_nodes")
      .select(
        `${companySelect}, category:ai_industry_categories(id,map_id,slug,name,sort_order,description), map:ai_market_maps(id,slug,name,description,region_scope)`,
      )
      .order("name");

    if (error) {
      return aiCompanyNodesSeed.map(withSeedMapAndCategory);
    }

    return (data ?? []) as unknown as AiCompanyWithCategory[];
  } catch {
    return aiCompanyNodesSeed.map(withSeedMapAndCategory);
  }
}

export async function getAiCompanyByTicker(
  ticker: string,
): Promise<AiCompanyDetail | null> {
  const match = await findUniqueAiCompanyByTicker(ticker);

  if (!match) {
    return null;
  }

  return getAiCompanyByExchangeAndTicker(match.exchange, match.ticker);
}

export async function findUniqueAiCompanyByTicker(
  ticker: string,
): Promise<Pick<AiCompanyNode, "ticker" | "exchange"> | null> {
  const normalized = normalizeRouteSegment(ticker);
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    const matches = aiCompanyNodesSeed.filter((item) => item.ticker === normalized);
    return matches.length === 1
      ? { ticker: matches[0].ticker, exchange: matches[0].exchange }
      : null;
  }

  try {
    const { data, error } = await supabase
      .from("ai_company_nodes")
      .select("ticker,exchange")
      .eq("ticker", normalized)
      .limit(2);

    if (error) {
      return null;
    }

    return data?.length === 1
      ? { ticker: data[0].ticker as string, exchange: data[0].exchange as string }
      : null;
  } catch {
    return null;
  }
}

export async function getAiCompanyByExchangeAndTicker(
  exchange: string,
  ticker: string,
): Promise<AiCompanyDetail | null> {
  const normalizedExchange = normalizeRouteSegment(exchange);
  const normalizedTicker = normalizeRouteSegment(ticker);
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return getSeedCompanyDetail(normalizedExchange, normalizedTicker);
  }

  try {
    const { data: company, error } = await supabase
      .from("ai_company_nodes")
      .select(
        `${companySelect}, category:ai_industry_categories(id,map_id,slug,name,sort_order,description), map:ai_market_maps(id,slug,name,description,region_scope)`,
      )
      .eq("exchange", normalizedExchange)
      .eq("ticker", normalizedTicker)
      .maybeSingle();

    if (error || !company) {
      return getSeedCompanyDetail(normalizedExchange, normalizedTicker);
    }

    const companyId = (company as AiCompanyNode).id;
    const [{ data: links }, { data: relationships }, { data: theses }] =
      await Promise.all([
        supabase
          .from("ai_narrative_companies")
          .select(
            "narrative_id,company_id,role,notes,narrative:ai_narratives(id,slug,name,description,status,regime_relevance,risks)",
          )
          .eq("company_id", companyId),
        supabase
          .from("ai_company_relationships")
          .select("*")
          .or(`source_company_id.eq.${companyId},target_company_id.eq.${companyId}`),
        supabase
          .from("ai_theses")
          .select("id,company_id,title,thesis,status,confidence,time_horizon")
          .eq("company_id", companyId)
          .order("confidence", { ascending: false }),
      ]);

    const nodes = await listAiCompanies();
    const base = company as unknown as AiCompanyWithCategory;
    const rels = ((relationships ?? []) as AiCompanyRelationship[]).map(
      (relationship) => ({
        ...relationship,
        source:
          nodes.find((node) => node.id === relationship.source_company_id) ?? null,
        target:
          nodes.find((node) => node.id === relationship.target_company_id) ?? null,
      }),
    );

    return {
      ...base,
      narratives: ((links ?? []) as Array<Record<string, unknown>>).map((link) => ({
        ...((link.narrative as object) ?? {}),
        role: String(link.role ?? ""),
        notes: String(link.notes ?? ""),
      })) as AiCompanyDetail["narratives"],
      relationships: rels,
      theses: (theses ?? []) as AiCompanyDetail["theses"],
    };
  } catch {
    return getSeedCompanyDetail(normalizedExchange, normalizedTicker);
  }
}

export function getCompanyPath(
  company: Pick<AiCompanyNode, "ticker" | "exchange">,
): string {
  return `/ai/companies/${encodeURIComponent(company.exchange)}/${encodeURIComponent(company.ticker)}`;
}

const normalizeRouteSegment = (value: string): string =>
  decodeURIComponent(value).trim().toUpperCase();

const withSeedMapAndCategory = (company: AiCompanyNode): AiCompanyWithCategory => ({
  ...company,
  category:
    aiIndustryCategoriesSeed.find((category) => category.id === company.category_id) ??
    null,
  map: aiMarketMapsSeed.find((map) => map.id === company.map_id) ?? null,
});

const getSeedCompanyDetail = (
  exchange: string,
  ticker: string,
): AiCompanyDetail | null => {
  const company = aiCompanyNodesSeed.find(
    (item) => item.exchange === exchange && item.ticker === ticker,
  );

  if (!company) {
    return null;
  }

  const base = withSeedMapAndCategory(company);
  const narratives = aiNarrativeCompaniesSeed
    .filter((link) => link.company_id === company.id)
    .map((link) => {
      const narrative = aiNarrativesSeed.find(
        (item) => item.id === link.narrative_id,
      );

      return narrative ? { ...narrative, role: link.role, notes: link.notes } : null;
    })
    .filter((item): item is AiCompanyDetail["narratives"][number] =>
      Boolean(item),
    );
  const relationships = aiCompanyRelationshipsSeed
    .filter(
      (relationship) =>
        relationship.source_company_id === company.id ||
        relationship.target_company_id === company.id,
    )
    .map((relationship) => ({
      ...relationship,
      source:
        aiCompanyNodesSeed.find(
          (node) => node.id === relationship.source_company_id,
        ) ?? null,
      target:
        aiCompanyNodesSeed.find(
          (node) => node.id === relationship.target_company_id,
        ) ?? null,
    }));
  const theses = aiThesesSeed.filter((thesis) => thesis.company_id === company.id);

  return {
    ...base,
    narratives,
    relationships,
    theses,
  };
};
