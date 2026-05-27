import "server-only";

import { createAiIndustryReadClient } from "@/lib/ai-industry/client";
import { aiThesesSeed } from "@/lib/ai-industry/seed";
import type { AiThesis } from "@/lib/ai-industry/types";

export async function listAiTheses(): Promise<AiThesis[]> {
  const supabase = createAiIndustryReadClient();

  if (!supabase) {
    return aiThesesSeed;
  }

  try {
    const { data, error } = await supabase
      .from("ai_theses")
      .select("id,company_id,title,thesis,status,confidence,time_horizon")
      .order("confidence", { ascending: false });

    if (error) {
      return aiThesesSeed;
    }

    return (data ?? []) as AiThesis[];
  } catch {
    return aiThesesSeed;
  }
}
