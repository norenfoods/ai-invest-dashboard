export type AiMarketMap = {
  id: string;
  slug: string;
  name: string;
  description: string;
  region_scope: string[];
};

export type AiIndustryCategory = {
  id: string;
  map_id: string;
  slug: string;
  name: string;
  sort_order: number;
  description: string;
};

export type AiCompanyNode = {
  id: string;
  ticker: string;
  exchange: string;
  name: string;
  region: string;
  country: string | null;
  map_id: string;
  category_id: string;
  ai_narrative: string;
  thesis: string;
  beneficiaries: string[];
  dependency_relationships: string[];
  market_regime_relevance: string;
  valuation_context: string;
  earnings_memory: string;
  is_core: boolean;
};

export type AiCompanyRelationship = {
  id: string;
  source_company_id: string;
  target_company_id: string;
  relationship_type: string;
  description: string;
  strength: number;
  evidence: string;
};

export type AiNarrative = {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  regime_relevance: string;
  risks: string[];
};

export type AiNarrativeCompany = {
  narrative_id: string;
  company_id: string;
  role: string;
  notes: string;
};

export type AiThesis = {
  id: string;
  company_id: string;
  title: string;
  thesis: string;
  status: string;
  confidence: number;
  time_horizon: string;
};

export type AiThesisEvent = {
  id: string;
  thesis_id: string;
  event_date: string;
  event_type: string;
  summary: string;
  impact: string;
  confidence_delta: number;
  source: string;
};

export type AiCompanyWithCategory = AiCompanyNode & {
  category: AiIndustryCategory | null;
  map: AiMarketMap | null;
};

export type AiMapDetail = AiMarketMap & {
  categories: Array<AiIndustryCategory & { companies: AiCompanyNode[] }>;
};

export type AiNarrativeDetail = AiNarrative & {
  companies: Array<AiCompanyNode & { role: string; notes: string }>;
};

export type AiCompanyDetail = AiCompanyWithCategory & {
  narratives: Array<AiNarrative & { role: string; notes: string }>;
  relationships: Array<
    AiCompanyRelationship & {
      source: AiCompanyNode | null;
      target: AiCompanyNode | null;
    }
  >;
  theses: AiThesis[];
};
