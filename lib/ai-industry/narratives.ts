import "server-only";

import { createAiIndustryReadClient } from "@/lib/ai-industry/client";
import {
  aiCompanyNodesSeed,
  aiNarrativeCompaniesSeed,
  aiNarrativesSeed,
} from "@/lib/ai-industry/seed";
import type { AiNarrativeDetail } from "@/lib/ai-industry/types";

const narrativeSelect = "id,slug,name,description,status,regime_relevance,risks";

export async function listAiNarratives(): Promise<AiNarrativeDetail[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return getSeedNarratives();
  }

  try {
    const { data: narratives, error } = await supabase
      .from("ai_narratives")
      .select(narrativeSelect)
      .order("name");

    if (error) {
      return getSeedNarratives();
    }

    const { data: links } = await supabase
      .from("ai_narrative_companies")
      .select(
        "narrative_id,company_id,role,notes,company:ai_company_nodes(id,ticker,exchange,name,region,country,map_id,category_id,ai_narrative,thesis,beneficiaries,dependency_relationships,market_regime_relevance,valuation_context,earnings_memory,is_core)",
      );

    return ((narratives ?? []) as AiNarrativeDetail[]).map((narrative) => ({
      ...narrative,
      companies: ((links ?? []) as Array<Record<string, unknown>>)
        .filter((link) => link.narrative_id === narrative.id)
        .map((link) => ({
          ...((link.company as object) ?? {}),
          role: String(link.role ?? ""),
          notes: String(link.notes ?? ""),
        })) as AiNarrativeDetail["companies"],
    }));
  } catch {
    return getSeedNarratives();
  }
}

const getSeedNarratives = (): AiNarrativeDetail[] =>
  aiNarrativesSeed.map((narrative) => ({
    ...narrative,
    companies: aiNarrativeCompaniesSeed
      .filter((link) => link.narrative_id === narrative.id)
      .map((link) => {
        const company = aiCompanyNodesSeed.find(
          (item) => item.id === link.company_id,
        );

        return company ? { ...company, role: link.role, notes: link.notes } : null;
      })
      .filter((item): item is AiNarrativeDetail["companies"][number] =>
        Boolean(item),
      ),
  }));
