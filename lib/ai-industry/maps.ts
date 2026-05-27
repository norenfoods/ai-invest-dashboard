import "server-only";

import { createAiIndustryReadClient } from "@/lib/ai-industry/client";
import {
  aiCompanyNodesSeed,
  aiIndustryCategoriesSeed,
  aiMarketMapsSeed,
} from "@/lib/ai-industry/seed";
import type {
  AiIndustryCategory,
  AiMapDetail,
  AiMarketMap,
} from "@/lib/ai-industry/types";

const mapSelect = "id,slug,name,description,region_scope";
const categorySelect = "id,map_id,slug,name,sort_order,description";
const companySelect =
  "id,ticker,exchange,name,region,country,map_id,category_id,ai_narrative,thesis,beneficiaries,dependency_relationships,market_regime_relevance,valuation_context,earnings_memory,is_core";

export async function listAiMarketMaps(): Promise<AiMarketMap[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return aiMarketMapsSeed;
  }

  try {
    const { data, error } = await supabase
      .from("ai_market_maps")
      .select(mapSelect)
      .order("slug");

    if (error) {
      return aiMarketMapsSeed;
    }

    return (data ?? []) as AiMarketMap[];
  } catch {
    return aiMarketMapsSeed;
  }
}

export async function getAiMarketMap(slug: string): Promise<AiMapDetail | null> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return getSeedMapDetail(slug);
  }

  try {
    const { data: map, error: mapError } = await supabase
      .from("ai_market_maps")
      .select(mapSelect)
      .eq("slug", slug)
      .maybeSingle();

    if (mapError || !map) {
      return getSeedMapDetail(slug);
    }

    const [
      { data: categories, error: categoriesError },
      { data: companies, error: companiesError },
    ] = await Promise.all([
      supabase
        .from("ai_industry_categories")
        .select(categorySelect)
        .eq("map_id", map.id)
        .order("sort_order"),
      supabase
        .from("ai_company_nodes")
        .select(companySelect)
        .eq("map_id", map.id)
        .order("name"),
    ]);

    if (categoriesError || companiesError) {
      console.warn("AI market map child query failed; using seed fallback.", {
        slug,
        categoriesError: categoriesError?.message,
        companiesError: companiesError?.message,
      });
      return getSeedMapDetail(slug);
    }

    return buildMapDetail(
      map as AiMarketMap,
      ((categories ?? []) as AiIndustryCategory[]).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
      (companies ?? []) as AiMapDetail["categories"][number]["companies"],
    );
  } catch {
    return getSeedMapDetail(slug);
  }
}

const getSeedMapDetail = (slug: string): AiMapDetail | null => {
  const map = aiMarketMapsSeed.find((item) => item.slug === slug);

  if (!map) {
    return null;
  }

  const categories = aiIndustryCategoriesSeed
    .filter((item) => item.map_id === map.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const companies = aiCompanyNodesSeed.filter((item) => item.map_id === map.id);

  return buildMapDetail(map, categories, companies);
};

const buildMapDetail = (
  map: AiMarketMap,
  categories: AiIndustryCategory[],
  companies: AiMapDetail["categories"][number]["companies"],
): AiMapDetail => ({
  ...map,
  categories: categories.map((category) => ({
    ...category,
    companies: companies.filter((company) => company.category_id === category.id),
  })),
});
