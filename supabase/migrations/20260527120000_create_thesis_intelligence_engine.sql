alter table public.ai_theses
add column if not exists slug text,
alter column company_id drop not null;

create unique index if not exists ai_theses_slug_unique_idx
on public.ai_theses (slug)
where slug is not null;

create table if not exists public.ai_thesis_companies (
  thesis_id uuid not null references public.ai_theses(id) on delete cascade,
  company_id uuid not null references public.ai_company_nodes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thesis_id, company_id)
);

create table if not exists public.ai_thesis_narratives (
  thesis_id uuid not null references public.ai_theses(id) on delete cascade,
  narrative_id uuid not null references public.ai_narratives(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thesis_id, narrative_id)
);

create table if not exists public.ai_thesis_evidence (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.ai_theses(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('support', 'contradict')),
  summary text not null,
  source_type text not null default 'research_note',
  confidence_impact integer not null default 0 check (confidence_impact between -5 and 5),
  event_date date not null,
  related_company_id uuid references public.ai_company_nodes(id) on delete set null,
  related_narrative_id uuid references public.ai_narratives(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_thesis_companies_company_idx
on public.ai_thesis_companies (company_id);

create index if not exists ai_thesis_narratives_narrative_idx
on public.ai_thesis_narratives (narrative_id);

create index if not exists ai_thesis_evidence_thesis_date_idx
on public.ai_thesis_evidence (thesis_id, event_date desc);

create index if not exists ai_thesis_evidence_related_company_idx
on public.ai_thesis_evidence (related_company_id);

create index if not exists ai_thesis_evidence_related_narrative_idx
on public.ai_thesis_evidence (related_narrative_id);

alter table public.ai_thesis_companies enable row level security;
alter table public.ai_thesis_narratives enable row level security;
alter table public.ai_thesis_evidence enable row level security;

create policy "ai_thesis_companies_read_public"
on public.ai_thesis_companies for select
to anon, authenticated
using (true);

create policy "ai_thesis_narratives_read_public"
on public.ai_thesis_narratives for select
to anon, authenticated
using (true);

create policy "ai_thesis_evidence_read_public"
on public.ai_thesis_evidence for select
to anon, authenticated
using (true);

with inserted_theses as (
  insert into public.ai_theses (
    slug,
    company_id,
    title,
    thesis,
    status,
    confidence,
    time_horizon
  )
  values
    (
      'china-domestic-gpu-substitution',
      null,
      'China domestic GPU substitution',
      'China AI infrastructure demand will increasingly route toward domestic accelerators and supporting semiconductor infrastructure as export controls, procurement policy, and sovereign compute priorities make foreign GPU availability less reliable.',
      'active',
      3,
      '24-36 months'
    ),
    (
      'ai-capex-supercycle',
      null,
      'AI capex supercycle',
      'Hyperscalers, sovereign buyers, and AI-native platforms are likely to sustain a multi-year infrastructure buildout across accelerators, networking, foundry, memory, and datacenter physical infrastructure.',
      'active',
      4,
      '18-36 months'
    ),
    (
      'hbm-shortage-persistence',
      null,
      'HBM shortage persistence',
      'HBM supply is likely to remain structurally tight because AI accelerator roadmaps keep increasing memory bandwidth requirements faster than high-yield advanced memory and packaging capacity can normalize.',
      'active',
      4,
      '12-24 months'
    ),
    (
      'inference-demand-acceleration',
      null,
      'Inference demand acceleration',
      'Inference workloads should become a larger and more persistent source of AI infrastructure demand as consumer AI, enterprise copilots, search, agents, and vertical applications move from pilots to repeated production usage.',
      'watching',
      3,
      '12-30 months'
    ),
    (
      'datacenter-power-bottleneck',
      null,
      'Datacenter power bottleneck',
      'Power availability, cooling density, and grid interconnect timelines are becoming binding constraints on AI datacenter deployment, shifting incremental value toward electrical and thermal infrastructure suppliers.',
      'active',
      4,
      '24-48 months'
    )
  on conflict (slug) where slug is not null do update set
    company_id = excluded.company_id,
    title = excluded.title,
    thesis = excluded.thesis,
    status = excluded.status,
    confidence = excluded.confidence,
    time_horizon = excluded.time_horizon,
    updated_at = now()
  returning id, slug
),
all_theses as (
  select id, slug from inserted_theses
  union
  select id, slug
  from public.ai_theses
  where slug in (
    'china-domestic-gpu-substitution',
    'ai-capex-supercycle',
    'hbm-shortage-persistence',
    'inference-demand-acceleration',
    'datacenter-power-bottleneck'
  )
),
companies as (
  select id, ticker, exchange from public.ai_company_nodes
),
narratives as (
  select id, slug from public.ai_narratives
),
company_links as (
  select all_theses.id as thesis_id, companies.id as company_id
  from (
    values
      ('china-domestic-gpu-substitution', '688256', 'SSE STAR'),
      ('china-domestic-gpu-substitution', '688041', 'SSE STAR'),
      ('china-domestic-gpu-substitution', '688981', 'SSE STAR'),
      ('china-domestic-gpu-substitution', '002371', 'SZSE'),
      ('china-domestic-gpu-substitution', '000977', 'SZSE'),
      ('ai-capex-supercycle', 'NVDA', 'NASDAQ'),
      ('ai-capex-supercycle', 'TSM', 'NYSE'),
      ('ai-capex-supercycle', 'AVGO', 'NASDAQ'),
      ('ai-capex-supercycle', 'ANET', 'NYSE'),
      ('ai-capex-supercycle', 'VRT', 'NYSE'),
      ('hbm-shortage-persistence', '000660', 'KRX'),
      ('hbm-shortage-persistence', 'MU', 'NASDAQ'),
      ('hbm-shortage-persistence', 'NVDA', 'NASDAQ'),
      ('hbm-shortage-persistence', 'TSM', 'NYSE'),
      ('inference-demand-acceleration', 'NVDA', 'NASDAQ'),
      ('inference-demand-acceleration', 'AMD', 'NASDAQ'),
      ('inference-demand-acceleration', 'ANET', 'NYSE'),
      ('inference-demand-acceleration', 'PLTR', 'NYSE'),
      ('inference-demand-acceleration', '002230', 'SZSE'),
      ('datacenter-power-bottleneck', 'VRT', 'NYSE'),
      ('datacenter-power-bottleneck', 'ETN', 'NYSE'),
      ('datacenter-power-bottleneck', 'NVDA', 'NASDAQ'),
      ('datacenter-power-bottleneck', 'TSM', 'NYSE')
  ) as seed(thesis_slug, ticker, exchange)
  join all_theses on all_theses.slug = seed.thesis_slug
  join companies on companies.ticker = seed.ticker and companies.exchange = seed.exchange
),
narrative_links as (
  select all_theses.id as thesis_id, narratives.id as narrative_id
  from (
    values
      ('china-domestic-gpu-substitution', 'china-domestic-substitution'),
      ('china-domestic-gpu-substitution', 'sovereign-ai'),
      ('ai-capex-supercycle', 'ai-capex-supercycle'),
      ('ai-capex-supercycle', 'sovereign-ai'),
      ('hbm-shortage-persistence', 'hbm-shortage'),
      ('hbm-shortage-persistence', 'ai-capex-supercycle'),
      ('inference-demand-acceleration', 'inference-demand-explosion'),
      ('inference-demand-acceleration', 'ai-agent-infrastructure'),
      ('datacenter-power-bottleneck', 'datacenter-power-bottleneck'),
      ('datacenter-power-bottleneck', 'ai-capex-supercycle')
  ) as seed(thesis_slug, narrative_slug)
  join all_theses on all_theses.slug = seed.thesis_slug
  join narratives on narratives.slug = seed.narrative_slug
)
insert into public.ai_thesis_companies (thesis_id, company_id)
select thesis_id, company_id from company_links
on conflict (thesis_id, company_id) do nothing;

with all_theses as (
  select id, slug
  from public.ai_theses
  where slug in (
    'china-domestic-gpu-substitution',
    'ai-capex-supercycle',
    'hbm-shortage-persistence',
    'inference-demand-acceleration',
    'datacenter-power-bottleneck'
  )
),
narratives as (
  select id, slug from public.ai_narratives
),
narrative_links as (
  select all_theses.id as thesis_id, narratives.id as narrative_id
  from (
    values
      ('china-domestic-gpu-substitution', 'china-domestic-substitution'),
      ('china-domestic-gpu-substitution', 'sovereign-ai'),
      ('ai-capex-supercycle', 'ai-capex-supercycle'),
      ('ai-capex-supercycle', 'sovereign-ai'),
      ('hbm-shortage-persistence', 'hbm-shortage'),
      ('hbm-shortage-persistence', 'ai-capex-supercycle'),
      ('inference-demand-acceleration', 'inference-demand-explosion'),
      ('inference-demand-acceleration', 'ai-agent-infrastructure'),
      ('datacenter-power-bottleneck', 'datacenter-power-bottleneck'),
      ('datacenter-power-bottleneck', 'ai-capex-supercycle')
  ) as seed(thesis_slug, narrative_slug)
  join all_theses on all_theses.slug = seed.thesis_slug
  join narratives on narratives.slug = seed.narrative_slug
)
insert into public.ai_thesis_narratives (thesis_id, narrative_id)
select thesis_id, narrative_id from narrative_links
on conflict (thesis_id, narrative_id) do nothing;

with all_theses as (
  select id, slug from public.ai_theses
),
companies as (
  select id, ticker, exchange from public.ai_company_nodes
),
narratives as (
  select id, slug from public.ai_narratives
)
insert into public.ai_thesis_evidence (
  thesis_id,
  evidence_type,
  summary,
  source_type,
  confidence_impact,
  event_date,
  related_company_id,
  related_narrative_id
)
select
  all_theses.id,
  seed.evidence_type,
  seed.summary,
  seed.source_type,
  seed.confidence_impact,
  seed.event_date::date,
  companies.id,
  narratives.id
from (
  values
    ('china-domestic-gpu-substitution', 'support', 'Export controls and sovereign procurement priorities keep domestic AI chips strategically relevant even when performance trails foreign leaders.', 'policy', 1, '2026-05-10', '688256', 'SSE STAR', 'china-domestic-substitution'),
    ('china-domestic-gpu-substitution', 'contradict', 'Advanced-node access, software ecosystem maturity, and model compatibility remain gating risks for broad domestic GPU adoption.', 'supply_chain', -1, '2026-05-12', '688981', 'SSE STAR', 'china-domestic-substitution'),
    ('ai-capex-supercycle', 'support', 'Hyperscaler commentary and supplier backlogs continue to point to elevated AI infrastructure spending across compute, networking, and datacenter buildouts.', 'earnings', 1, '2026-05-08', 'NVDA', 'NASDAQ', 'ai-capex-supercycle'),
    ('ai-capex-supercycle', 'contradict', 'Cloud ROI scrutiny and depreciation pressure could force digestion periods after rapid infrastructure deployment.', 'market_signal', -1, '2026-05-15', null, null, 'ai-capex-supercycle'),
    ('hbm-shortage-persistence', 'support', 'Accelerator roadmaps require higher HBM content and qualification cycles limit how quickly incremental supply can serve leading platforms.', 'supply_chain', 1, '2026-05-06', '000660', 'KRX', 'hbm-shortage'),
    ('hbm-shortage-persistence', 'contradict', 'Aggressive memory capex could loosen scarcity if demand growth slows or customers redesign around lower memory intensity.', 'capex_plan', -1, '2026-05-18', 'MU', 'NASDAQ', 'hbm-shortage'),
    ('inference-demand-acceleration', 'support', 'Production AI features, enterprise agents, and search workloads increase recurring inference traffic beyond one-time training cluster demand.', 'product_adoption', 1, '2026-05-11', 'NVDA', 'NASDAQ', 'inference-demand-explosion'),
    ('inference-demand-acceleration', 'contradict', 'Model efficiency gains and price competition may compress compute intensity per query before volume fully offsets deflation.', 'technology', -1, '2026-05-20', null, null, 'inference-demand-explosion'),
    ('datacenter-power-bottleneck', 'support', 'AI rack density and interconnect delays are pushing datacenter customers toward upgraded power distribution, cooling, and grid-facing infrastructure.', 'industry_check', 1, '2026-05-09', 'VRT', 'NYSE', 'datacenter-power-bottleneck'),
    ('datacenter-power-bottleneck', 'contradict', 'Delayed datacenter permits or slower GPU deployment could defer power equipment revenue recognition despite strong long-term need.', 'project_risk', -1, '2026-05-19', 'ETN', 'NYSE', 'datacenter-power-bottleneck')
) as seed(thesis_slug, evidence_type, summary, source_type, confidence_impact, event_date, ticker, exchange, narrative_slug)
join all_theses on all_theses.slug = seed.thesis_slug
left join companies on companies.ticker = seed.ticker and companies.exchange = seed.exchange
left join narratives on narratives.slug = seed.narrative_slug
where not exists (
  select 1
  from public.ai_thesis_evidence existing
  where existing.thesis_id = all_theses.id
    and existing.evidence_type = seed.evidence_type
    and existing.summary = seed.summary
);
