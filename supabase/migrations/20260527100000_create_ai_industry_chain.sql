create table if not exists public.ai_market_maps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  region_scope text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_industry_categories (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.ai_market_maps(id) on delete cascade,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, slug)
);

create table if not exists public.ai_company_nodes (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  exchange text not null,
  name text not null,
  region text not null,
  country text,
  map_id uuid not null references public.ai_market_maps(id) on delete cascade,
  category_id uuid not null references public.ai_industry_categories(id) on delete restrict,
  ai_narrative text not null default '',
  thesis text not null default '',
  beneficiaries text[] not null default '{}',
  dependency_relationships text[] not null default '{}',
  market_regime_relevance text not null default '',
  valuation_context text not null default '',
  earnings_memory text not null default '',
  is_core boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ticker, exchange)
);

create table if not exists public.ai_company_relationships (
  id uuid primary key default gen_random_uuid(),
  source_company_id uuid not null references public.ai_company_nodes(id) on delete cascade,
  target_company_id uuid not null references public.ai_company_nodes(id) on delete cascade,
  relationship_type text not null,
  description text not null default '',
  strength integer not null default 3 check (strength between 1 and 5),
  evidence text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_company_id, target_company_id, relationship_type)
);

create table if not exists public.ai_narratives (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  status text not null default 'emerging',
  regime_relevance text not null default '',
  risks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_narrative_companies (
  narrative_id uuid not null references public.ai_narratives(id) on delete cascade,
  company_id uuid not null references public.ai_company_nodes(id) on delete cascade,
  role text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  primary key (narrative_id, company_id, role)
);

create table if not exists public.ai_theses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.ai_company_nodes(id) on delete cascade,
  title text not null,
  thesis text not null,
  status text not null default 'active',
  confidence integer not null default 3 check (confidence between 1 and 5),
  time_horizon text not null default '12-24 months',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, title)
);

create table if not exists public.ai_thesis_events (
  id uuid primary key default gen_random_uuid(),
  thesis_id uuid not null references public.ai_theses(id) on delete cascade,
  event_date date not null,
  event_type text not null,
  summary text not null,
  impact text not null default '',
  confidence_delta integer not null default 0,
  source text not null default '',
  created_at timestamptz not null default now()
);

alter table public.research_memory
add column if not exists company_id uuid references public.ai_company_nodes(id) on delete set null,
add column if not exists narrative_id uuid references public.ai_narratives(id) on delete set null,
add column if not exists thesis_id uuid references public.ai_theses(id) on delete set null,
add column if not exists memory_type text;

create index if not exists ai_industry_categories_map_idx
on public.ai_industry_categories (map_id, sort_order);

create index if not exists ai_company_nodes_map_category_idx
on public.ai_company_nodes (map_id, category_id);

create index if not exists ai_company_nodes_ticker_idx
on public.ai_company_nodes (ticker);

create index if not exists ai_company_relationships_source_idx
on public.ai_company_relationships (source_company_id);

create index if not exists ai_company_relationships_target_idx
on public.ai_company_relationships (target_company_id);

create index if not exists ai_narrative_companies_company_idx
on public.ai_narrative_companies (company_id);

create index if not exists ai_theses_company_idx
on public.ai_theses (company_id);

create index if not exists research_memory_company_idx
on public.research_memory (company_id);

create index if not exists research_memory_narrative_idx
on public.research_memory (narrative_id);

create index if not exists research_memory_thesis_idx
on public.research_memory (thesis_id);

create index if not exists research_memory_memory_type_idx
on public.research_memory (memory_type);

alter table public.ai_market_maps enable row level security;
alter table public.ai_industry_categories enable row level security;
alter table public.ai_company_nodes enable row level security;
alter table public.ai_company_relationships enable row level security;
alter table public.ai_narratives enable row level security;
alter table public.ai_narrative_companies enable row level security;
alter table public.ai_theses enable row level security;
alter table public.ai_thesis_events enable row level security;

create policy "ai_market_maps_read_public"
on public.ai_market_maps for select
to anon, authenticated
using (true);

create policy "ai_industry_categories_read_public"
on public.ai_industry_categories for select
to anon, authenticated
using (true);

create policy "ai_company_nodes_read_public"
on public.ai_company_nodes for select
to anon, authenticated
using (true);

create policy "ai_company_relationships_read_public"
on public.ai_company_relationships for select
to anon, authenticated
using (true);

create policy "ai_narratives_read_public"
on public.ai_narratives for select
to anon, authenticated
using (true);

create policy "ai_narrative_companies_read_public"
on public.ai_narrative_companies for select
to anon, authenticated
using (true);

create policy "ai_theses_read_public"
on public.ai_theses for select
to anon, authenticated
using (true);

create policy "ai_thesis_events_read_public"
on public.ai_thesis_events for select
to anon, authenticated
using (true);

insert into public.ai_market_maps (slug, name, description, region_scope)
values
  ('global-ai', 'Global AI Market Map', 'Global AI infrastructure and application chain across US, Japan, Korea, Taiwan, and Europe.', array['US', 'Japan', 'Korea', 'Taiwan', 'Europe']),
  ('china-domestic-substitution', 'China AI 国产替代 Market Map', 'China AI domestic substitution chain focused on semiconductor sovereignty, infrastructure localization, and domestic AI applications.', array['China', 'Hong Kong'])
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  region_scope = excluded.region_scope,
  updated_at = now();

with maps as (
  select id, slug from public.ai_market_maps
)
insert into public.ai_industry_categories (map_id, slug, name, sort_order, description)
select maps.id, seed.slug, seed.name, seed.sort_order, seed.description
from maps
join (
  values
    ('global-ai', 'gpu-accelerators', 'GPU / Accelerators', 10, 'AI training and inference silicon leaders.'),
    ('global-ai', 'hbm-memory', 'HBM / Memory', 20, 'High-bandwidth memory and advanced DRAM beneficiaries.'),
    ('global-ai', 'foundry', 'Foundry', 30, 'Advanced-node manufacturing and wafer capacity.'),
    ('global-ai', 'semiconductor-equipment', 'Semiconductor Equipment', 40, 'Lithography, deposition, etch, process and back-end equipment.'),
    ('global-ai', 'networking-optical', 'Networking / Optical', 50, 'AI cluster networking, switching, optical modules, and interconnect.'),
    ('global-ai', 'datacenter-power', 'Datacenter Infrastructure / Power', 60, 'Power, cooling, electrical infrastructure, and datacenter physical layer.'),
    ('global-ai', 'ai-software-saas', 'AI Software / SaaS', 70, 'Data, analytics, workflow, and enterprise AI software.'),
    ('global-ai', 'ai-applications', 'AI Applications', 80, 'AI-native applications and vertical software.'),
    ('global-ai', 'robotics-automation', 'Robotics / Automation', 90, 'Industrial automation and robotics exposed to AI-enabled manufacturing.'),
    ('china-domestic-substitution', 'ai-chips', 'AI chips', 10, 'Domestic AI accelerators and CPU/GPU alternatives.'),
    ('china-domestic-substitution', 'foundry', 'Foundry', 20, 'Domestic wafer manufacturing and process localization.'),
    ('china-domestic-substitution', 'semiconductor-equipment', 'Semiconductor equipment', 30, 'Domestic process equipment and fab localization.'),
    ('china-domestic-substitution', 'advanced-packaging-osat', 'Advanced packaging / OSAT', 40, 'Packaging, test, and advanced integration bottlenecks.'),
    ('china-domestic-substitution', 'ai-servers', 'AI servers', 50, 'Localized AI server and infrastructure platforms.'),
    ('china-domestic-substitution', 'optical-cpo', 'Optical modules / CPO', 60, 'Optics, CPO, and high-speed datacenter connectivity.'),
    ('china-domestic-substitution', 'pcb-interconnect', 'PCB / high-speed interconnect', 70, 'High-speed PCB and interconnect supply chain.'),
    ('china-domestic-substitution', 'ai-applications-software', 'AI applications / software', 80, 'Domestic AI software and application platforms.')
) as seed(map_slug, slug, name, sort_order, description)
on maps.slug = seed.map_slug
on conflict (map_id, slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  description = excluded.description,
  updated_at = now();

with maps as (
  select id, slug from public.ai_market_maps
),
categories as (
  select c.id, c.slug, m.slug as map_slug
  from public.ai_industry_categories c
  join public.ai_market_maps m on m.id = c.map_id
)
insert into public.ai_company_nodes (
  ticker,
  exchange,
  name,
  region,
  country,
  map_id,
  category_id,
  ai_narrative,
  thesis,
  beneficiaries,
  dependency_relationships,
  market_regime_relevance,
  valuation_context,
  earnings_memory
)
select
  seed.ticker,
  seed.exchange,
  seed.name,
  seed.region,
  seed.country,
  maps.id,
  categories.id,
  seed.ai_narrative,
  seed.thesis,
  seed.beneficiaries,
  seed.dependencies,
  seed.regime,
  seed.valuation,
  seed.earnings
from (
  values
    ('NVDA', 'NASDAQ', 'NVIDIA', 'US', 'United States', 'global-ai', 'gpu-accelerators', 'Core accelerator platform for AI training and inference.', 'NVIDIA remains the reference architecture for AI compute, with software lock-in and networking integration expanding its system-level moat.', array['HBM suppliers', 'advanced packaging', 'AI cloud providers'], array['TSMC advanced nodes', 'HBM supply', 'CoWoS packaging'], 'Most leveraged to AI capex acceleration and most vulnerable to capex digestion cycles.', 'Premium multiple reflects dominant share and durable growth expectations.', 'Track datacenter revenue, gross margin, supply constraints, and inference mix.'),
    ('AMD', 'NASDAQ', 'AMD', 'US', 'United States', 'global-ai', 'gpu-accelerators', 'Second-source AI accelerator challenger.', 'AMD is the most credible merchant GPU alternative where hyperscalers need supply diversity and pricing leverage.', array['HBM suppliers', 'ODM server platforms'], array['TSMC advanced nodes', 'HBM supply', 'software ecosystem adoption'], 'Benefits when AI buyers diversify away from single-vendor dependence.', 'Valuation depends on visible accelerator share gains.', 'Track MI-series ramp, hyperscaler design wins, and datacenter GPU backlog.'),
    ('AVGO', 'NASDAQ', 'Broadcom', 'US', 'United States', 'global-ai', 'networking-optical', 'Custom silicon and networking beneficiary of AI scale-out.', 'Broadcom participates in AI through custom accelerators, switching, and high-value connectivity inside hyperscale clusters.', array['hyperscale AI capex', 'custom ASIC adoption'], array['hyperscaler capex', 'advanced packaging', 'networking cycles'], 'Strong in scale-out networking and custom silicon cycles.', 'Quality compounder multiple tied to AI custom silicon durability.', 'Track AI semiconductor revenue disclosures and hyperscaler concentration.'),
    ('MU', 'NASDAQ', 'Micron', 'US', 'United States', 'global-ai', 'hbm-memory', 'US memory exposure to HBM shortage.', 'Micron gives liquid US exposure to HBM and memory cycle tightening driven by AI server content growth.', array['AI server BOM growth', 'HBM pricing'], array['HBM qualification', 'DRAM cycle', 'capex discipline'], 'Highly sensitive to memory upcycle and AI server unit growth.', 'Cyclical valuation should be read against normalized memory earnings.', 'Track HBM qualification, pricing, and DRAM supply discipline.'),
    ('000660', 'KRX', 'SK Hynix', 'Korea', 'South Korea', 'global-ai', 'hbm-memory', 'HBM leader embedded in AI accelerator supply chains.', 'SK Hynix is a primary HBM beneficiary as accelerator memory bandwidth becomes a binding constraint.', array['NVIDIA platform growth', 'HBM shortage'], array['HBM yields', 'advanced packaging', 'memory cycle'], 'Direct beneficiary of HBM scarcity and AI server mix shift.', 'Valuation depends on HBM margin durability and memory cycle breadth.', 'Track HBM share, pricing, and customer concentration.'),
    ('TSM', 'NYSE', 'TSMC', 'Taiwan', 'Taiwan', 'global-ai', 'foundry', 'Advanced-node foundry bottleneck for AI silicon.', 'TSMC is the manufacturing choke point for leading AI accelerators, custom silicon, and advanced packaging.', array['AI accelerator demand', 'advanced packaging'], array['geopolitical risk', 'tool availability', 'CoWoS capacity'], 'Core picks-and-shovels node in AI capex cycle.', 'Premium foundry valuation tied to leading-node utilization and pricing power.', 'Track HPC revenue, N2/N3 ramps, CoWoS capacity, and capex guidance.'),
    ('ASML', 'AMS', 'ASML', 'Europe', 'Netherlands', 'global-ai', 'semiconductor-equipment', 'EUV lithography monopoly for leading-edge AI chips.', 'ASML controls the critical lithography layer required for advanced-node AI silicon scaling.', array['foundry capex', 'logic roadmap'], array['export controls', 'fab capex timing'], 'Benefits from sustained leading-edge capex but sensitive to order timing.', 'Long-duration monopoly premium with cyclical order volatility.', 'Track bookings, China restrictions, and EUV/high-NA demand.'),
    ('8035', 'TSE', 'Tokyo Electron', 'Japan', 'Japan', 'global-ai', 'semiconductor-equipment', 'Process equipment beneficiary of advanced logic and memory capex.', 'Tokyo Electron is exposed to leading-edge process complexity across logic, memory, and advanced packaging.', array['foundry capex', 'memory capex recovery'], array['wafer fab equipment cycle', 'export controls'], 'Cyclical equipment beneficiary when AI drives fab investment.', 'Valuation tracks WFE cycle recovery and leading-edge intensity.', 'Track orders, China exposure, and memory equipment rebound.'),
    ('VRT', 'NYSE', 'Vertiv', 'US', 'United States', 'global-ai', 'datacenter-power', 'Power and cooling beneficiary of dense AI datacenters.', 'Vertiv benefits as AI rack density turns power and thermal management into a datacenter bottleneck.', array['hyperscale datacenters', 'liquid cooling adoption'], array['datacenter build schedules', 'power availability'], 'Second-order AI capex winner when physical infrastructure bottlenecks matter.', 'Valuation reflects strong growth and execution expectations.', 'Track orders, backlog, liquid cooling, and datacenter customer demand.'),
    ('ETN', 'NYSE', 'Eaton', 'US', 'Ireland', 'global-ai', 'datacenter-power', 'Electrical infrastructure exposure to AI power demand.', 'Eaton supplies power management infrastructure needed for grid-constrained AI datacenter expansion.', array['datacenter electrification', 'grid upgrades'], array['utility interconnect timing', 'industrial cycle'], 'Benefits from AI power bottleneck and electrification capex.', 'Industrial premium tied to datacenter mix and margin durability.', 'Track electrical segment orders and datacenter project commentary.'),
    ('ANET', 'NYSE', 'Arista Networks', 'US', 'United States', 'global-ai', 'networking-optical', 'AI cluster networking leader.', 'Arista is a core beneficiary of Ethernet scale-out networking in AI clusters.', array['AI cluster buildouts', 'Ethernet adoption'], array['cloud titan capex', 'competitive switching cycles'], 'Strong when AI networks standardize around high-speed Ethernet.', 'Valuation depends on cloud capex visibility and AI networking share.', 'Track cloud titan revenue and 400G/800G transition.'),
    ('COHR', 'NYSE', 'Coherent', 'US', 'United States', 'global-ai', 'networking-optical', 'Optical component exposure to AI datacenter bandwidth.', 'Coherent benefits from optical transceiver demand as AI clusters require higher bandwidth and lower latency.', array['800G/1.6T optics', 'datacenter networking'], array['optical cycle', 'customer inventory'], 'High beta to AI optical demand and networking upgrade cycles.', 'Turnaround valuation tied to optical growth and margin recovery.', 'Track datacom demand, margin progression, and AI customer orders.'),
    ('PLTR', 'NYSE', 'Palantir', 'US', 'United States', 'global-ai', 'ai-software-saas', 'Enterprise AI operating layer.', 'Palantir monetizes AI through operational workflows, government demand, and enterprise AI deployment infrastructure.', array['AI software budgets', 'government AI adoption'], array['enterprise deployment cycles', 'valuation sensitivity'], 'Software narrative leader when AI shifts from infrastructure to applications.', 'High multiple requires sustained growth and margin execution.', 'Track commercial customer growth, AIP adoption, and government expansion.'),
    ('6954', 'TSE', 'FANUC', 'Japan', 'Japan', 'global-ai', 'robotics-automation', 'Industrial automation node for AI-enabled manufacturing.', 'FANUC offers robotics exposure where AI improves factory automation, precision, and labor substitution.', array['factory automation', 'robotics cycle'], array['industrial capex', 'China automation demand'], 'Later-cycle beneficiary if AI productivity themes move into robotics.', 'Cyclical industrial valuation tied to automation recovery.', 'Track robot orders, China demand, and factory automation recovery.'),
    ('688256', 'SSE STAR', '寒武纪', 'China', 'China', 'china-domestic-substitution', 'ai-chips', '国产 AI 加速芯片核心标的。', '寒武纪代表中国 AI 芯片自主化的高弹性方向，核心变量是国产算力需求、生态适配和供给约束。', array['国产算力集群', '政企 AI 基建'], array['先进制程可得性', '软件生态', '客户验证'], '高度受益于国产替代和主权 AI 叙事升温。', '估值高度反映国产 AI 芯片稀缺性，需要跟踪收入兑现。', '跟踪订单、毛利率、研发投入和客户验证。'),
    ('688041', 'SSE STAR', '海光信息', 'China', 'China', 'china-domestic-substitution', 'ai-chips', '国产 CPU/GPU 与服务器算力替代。', '海光信息受益于政企算力国产化和 AI 基础设施自主可控需求。', array['国产服务器', '政企信创'], array['先进制程', '生态兼容', '政府采购节奏'], '国产算力和信创周期核心受益者。', '估值取决于国产算力订单持续性。', '跟踪营收增速、存货、订单和政企客户节奏。'),
    ('688981', 'SSE STAR', '中芯国际', 'China', 'China', 'china-domestic-substitution', 'foundry', '中国先进制程与成熟制程制造底座。', '中芯国际是国产半导体供应链的制造底座，受益于本土芯片设计公司国产化需求。', array['国产芯片设计', '成熟制程国产化'], array['设备限制', '良率', '地缘政策'], '半导体主权周期的核心底层资产。', '估值需要结合制程约束、折旧和周期利用率。', '跟踪产能利用率、资本开支和先进制程进展。'),
    ('1347', 'HKEX', '华虹半导体', 'China', 'China', 'china-domestic-substitution', 'foundry', '特色工艺与成熟制程国产替代。', '华虹半导体受益于功率、MCU、模拟和特色工艺本土化需求。', array['成熟制程国产化', '功率半导体'], array['周期利用率', '价格压力'], '国产替代中偏成熟制程和特色工艺的弹性节点。', '估值与利用率和价格周期高度相关。', '跟踪产能利用率、ASP 和扩产节奏。'),
    ('002371', 'SZSE', '北方华创', 'China', 'China', 'china-domestic-substitution', 'semiconductor-equipment', '国产半导体设备平台型龙头。', '北方华创覆盖刻蚀、薄膜、清洗等关键设备，是国产 fab 扩产和设备替代的核心受益者。', array['国产 fab capex', '设备替代'], array['客户验证', '零部件国产化', 'capex 周期'], '半导体设备国产化最核心的 beta 与 alpha 结合点。', '估值反映平台稀缺性，需跟踪订单兑现。', '跟踪新签订单、毛利率和客户端验证。'),
    ('688012', 'SSE STAR', '中微公司', 'China', 'China', 'china-domestic-substitution', 'semiconductor-equipment', '刻蚀设备国产替代核心公司。', '中微公司在刻蚀等关键环节具备国产替代战略价值，受益于国内晶圆厂资本开支。', array['国产 fab capex', '先进制程设备验证'], array['客户验证', '竞争格局', '出口限制'], '设备国产化叙事中的关键工艺节点。', '估值依赖设备渗透率和订单持续性。', '跟踪刻蚀设备订单、验证进展和新产品突破。'),
    ('600584', 'SSE', '长电科技', 'China', 'China', 'china-domestic-substitution', 'advanced-packaging-osat', '先进封装与 OSAT 国产化平台。', '长电科技是中国封测龙头，受益于 AI 芯片对先进封装和高密度集成需求提升。', array['AI 芯片封装', '国产芯片设计'], array['封装技术升级', '客户周期'], '先进封装成为 AI 芯片国产化关键补短板方向。', '估值与封测周期和先进封装占比相关。', '跟踪先进封装收入、客户结构和盈利修复。'),
    ('002156', 'SZSE', '通富微电', 'China', 'China', 'china-domestic-substitution', 'advanced-packaging-osat', '高性能计算封测与先进封装受益者。', '通富微电受益于高性能芯片封测需求和国产 AI 供应链配套。', array['HPC 封测', '国产 AI 芯片'], array['客户集中度', '封测周期'], 'AI 芯片国产链条中的封测弹性节点。', '估值取决于先进封装放量和盈利弹性。', '跟踪大客户需求、资本开支和毛利率改善。'),
    ('000977', 'SZSE', '浪潮信息', 'China', 'China', 'china-domestic-substitution', 'ai-servers', 'AI 服务器国产基础设施。', '浪潮信息是国内 AI 服务器和算力基础设施核心供应商，受益于国产算力集群建设。', array['AI 服务器需求', '政企算力'], array['GPU/加速卡供给', '服务器毛利率'], 'AI 基建扩张和国产算力建设的直接受益者。', '估值受服务器订单和利润率波动影响。', '跟踪 AI 服务器订单、供应链约束和利润率。'),
    ('601138', 'SSE', '工业富联', 'China', 'China', 'china-domestic-substitution', 'ai-servers', 'AI 服务器制造与全球算力硬件组装。', '工业富联受益于 AI 服务器制造、机柜集成和全球云厂商硬件需求。', array['AI 服务器出货', '云厂商 capex'], array['客户集中度', '制造利润率'], 'AI 硬件出货周期中的制造和集成节点。', '估值取决于 AI 服务器占比和利润率结构。', '跟踪 AI 服务器收入占比、订单和毛利率。'),
    ('300308', 'SZSE', '中际旭创', 'China', 'China', 'china-domestic-substitution', 'optical-cpo', '高速光模块和 AI 网络核心受益者。', '中际旭创受益于 AI 集群 800G/1.6T 光模块需求，是中国光模块龙头之一。', array['AI 数据中心', '高速光模块'], array['海外云客户需求', '光模块价格周期'], 'AI 网络升级中最直接的光模块弹性资产。', '估值依赖高速光模块增长持续性。', '跟踪 800G/1.6T 订单、海外客户和毛利率。'),
    ('002230', 'SZSE', '科大讯飞', 'China', 'China', 'china-domestic-substitution', 'ai-applications-software', '国产大模型和 AI 应用平台。', '科大讯飞代表国内 AI 应用和大模型商业化方向，重点在教育、办公和政企场景。', array['国产大模型', 'AI 应用落地'], array['商业化速度', '算力成本', '竞争格局'], '当市场从算力转向应用兑现时叙事相关性提升。', '估值取决于 AI 应用收入兑现和费用控制。', '跟踪大模型产品收入、教育场景和政企订单。')
) as seed(ticker, exchange, name, region, country, map_slug, category_slug, ai_narrative, thesis, beneficiaries, dependencies, regime, valuation, earnings)
join maps on maps.slug = seed.map_slug
join categories on categories.map_slug = seed.map_slug and categories.slug = seed.category_slug
on conflict (ticker, exchange) do update set
  name = excluded.name,
  region = excluded.region,
  country = excluded.country,
  map_id = excluded.map_id,
  category_id = excluded.category_id,
  ai_narrative = excluded.ai_narrative,
  thesis = excluded.thesis,
  beneficiaries = excluded.beneficiaries,
  dependency_relationships = excluded.dependency_relationships,
  market_regime_relevance = excluded.market_regime_relevance,
  valuation_context = excluded.valuation_context,
  earnings_memory = excluded.earnings_memory,
  is_core = excluded.is_core,
  updated_at = now();

insert into public.ai_narratives (slug, name, description, status, regime_relevance, risks)
values
  ('ai-capex-supercycle', 'AI capex supercycle', 'Multi-year hyperscaler and sovereign investment cycle into AI compute, networking, power, and datacenter capacity.', 'accelerating', 'Defines the primary risk-on regime for AI infrastructure equities.', array['capex digestion', 'cloud ROI scrutiny', 'supply bottlenecks']),
  ('hbm-shortage', 'HBM shortage', 'High-bandwidth memory scarcity as accelerator performance becomes memory-bandwidth constrained.', 'accelerating', 'Supports memory pricing, HBM supplier margins, and accelerator supply allocation.', array['capacity overbuild', 'qualification delays', 'customer concentration']),
  ('inference-demand-explosion', 'Inference demand explosion', 'Shift from training clusters to persistent inference workloads across consumer, enterprise, and agentic software.', 'emerging', 'Broadens AI demand from GPUs into networking, memory, software infrastructure, and applications.', array['unit economics', 'model efficiency deflation', 'enterprise adoption delays']),
  ('datacenter-power-bottleneck', 'Datacenter power bottleneck', 'Power availability, cooling, and grid interconnect becoming constraints on AI datacenter deployment.', 'accelerating', 'Creates second-order beneficiaries in electrical equipment, cooling, and infrastructure.', array['project delays', 'policy constraints', 'grid congestion']),
  ('sovereign-ai', 'Sovereign AI', 'National and regional push to own AI compute, data, models, and infrastructure.', 'emerging', 'Adds non-hyperscaler demand and policy support for localized AI infrastructure.', array['budget cycles', 'export controls', 'procurement delays']),
  ('china-domestic-substitution', 'China domestic substitution', '国产替代 cycle across AI chips, semiconductor equipment, foundry, packaging, servers, optics, and AI software.', 'accelerating', 'Dominant China AI chain narrative when policy support and supply constraints converge.', array['technology gaps', 'valuation crowding', 'policy pacing']),
  ('ai-agent-infrastructure', 'AI agent infrastructure', 'Infrastructure and software stack required for AI agents, tool use, workflow automation, and operational AI systems.', 'emerging', 'Bridges infrastructure demand and enterprise software monetization.', array['enterprise readiness', 'security constraints', 'workflow integration'])
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  regime_relevance = excluded.regime_relevance,
  risks = excluded.risks,
  updated_at = now();

with companies as (
  select id, ticker, exchange from public.ai_company_nodes
),
narratives as (
  select id, slug from public.ai_narratives
)
insert into public.ai_narrative_companies (narrative_id, company_id, role, notes)
select narratives.id, companies.id, seed.role, seed.notes
from (
  values
    ('ai-capex-supercycle', 'NVDA', 'NASDAQ', 'winner', 'Primary accelerator beneficiary.'),
    ('ai-capex-supercycle', 'TSM', 'NYSE', 'bottleneck_supplier', 'Advanced-node and packaging capacity bottleneck.'),
    ('ai-capex-supercycle', 'AVGO', 'NASDAQ', 'second_order_beneficiary', 'Custom silicon and networking exposure.'),
    ('hbm-shortage', '000660', 'KRX', 'winner', 'HBM leadership and pricing leverage.'),
    ('hbm-shortage', 'MU', 'NASDAQ', 'winner', 'US-listed HBM and DRAM cycle exposure.'),
    ('inference-demand-explosion', 'NVDA', 'NASDAQ', 'winner', 'Inference platform and software ecosystem.'),
    ('inference-demand-explosion', 'AMD', 'NASDAQ', 'challenger', 'Alternative accelerator supply for inference workloads.'),
    ('datacenter-power-bottleneck', 'VRT', 'NYSE', 'winner', 'Power and cooling bottleneck exposure.'),
    ('datacenter-power-bottleneck', 'ETN', 'NYSE', 'second_order_beneficiary', 'Electrical infrastructure beneficiary.'),
    ('sovereign-ai', 'NVDA', 'NASDAQ', 'supplier', 'Sovereign AI compute platform provider.'),
    ('sovereign-ai', 'ASML', 'AMS', 'bottleneck_supplier', 'Critical lithography dependency for sovereign semiconductor ambitions.'),
    ('china-domestic-substitution', '688256', 'SSE STAR', 'winner', '国产 AI 芯片稀缺标的。'),
    ('china-domestic-substitution', '688981', 'SSE STAR', 'bottleneck_supplier', '国产制造底座。'),
    ('china-domestic-substitution', '002371', 'SZSE', 'winner', '设备国产化平台。'),
    ('china-domestic-substitution', '300308', 'SZSE', 'second_order_beneficiary', 'AI 光模块高弹性方向。'),
    ('ai-agent-infrastructure', 'PLTR', 'NYSE', 'winner', 'Operational AI and agent workflow infrastructure.'),
    ('ai-agent-infrastructure', '002230', 'SZSE', 'regional_beneficiary', '国产 AI 应用和大模型商业化。')
) as seed(narrative_slug, ticker, exchange, role, notes)
join narratives on narratives.slug = seed.narrative_slug
join companies on companies.ticker = seed.ticker and companies.exchange = seed.exchange
on conflict (narrative_id, company_id, role) do update set
  notes = excluded.notes;

with companies as (
  select id, ticker, exchange from public.ai_company_nodes
)
insert into public.ai_company_relationships (
  source_company_id,
  target_company_id,
  relationship_type,
  description,
  strength,
  evidence
)
select source.id, target.id, seed.relationship_type, seed.description, seed.strength, seed.evidence
from (
  values
    ('NVDA', 'NASDAQ', 'TSM', 'NYSE', 'dependency', 'NVIDIA advanced accelerators depend on TSMC leading-edge manufacturing and packaging capacity.', 5, 'Leading AI GPUs are manufactured at TSMC.'),
    ('AMD', 'NASDAQ', 'TSM', 'NYSE', 'dependency', 'AMD AI accelerators depend on TSMC advanced-node supply.', 5, 'MI-series accelerators rely on external advanced foundry capacity.'),
    ('NVDA', 'NASDAQ', '000660', 'KRX', 'dependency', 'NVIDIA accelerator supply is tied to HBM availability from memory leaders including SK Hynix.', 4, 'HBM is a core accelerator BOM bottleneck.'),
    ('ANET', 'NYSE', 'NVDA', 'NASDAQ', 'beneficiary', 'AI accelerator clusters increase demand for high-speed networking.', 4, 'Scale-out clusters require switching and networking fabrics.'),
    ('VRT', 'NYSE', 'NVDA', 'NASDAQ', 'second_order_beneficiary', 'Higher-density AI racks increase power and cooling demand.', 4, 'AI datacenters need upgraded physical infrastructure.'),
    ('688256', 'SSE STAR', '688981', 'SSE STAR', 'dependency', '国产 AI 芯片长期依赖国内晶圆制造能力提升。', 4, '国产算力链条需要制造底座。'),
    ('002371', 'SZSE', '688981', 'SSE STAR', 'supplier', '国产设备平台服务国内晶圆厂扩产和设备替代。', 4, '晶圆厂国产化提升设备需求。'),
    ('600584', 'SSE', '688256', 'SSE STAR', 'beneficiary', 'AI 芯片复杂度提升带动先进封装和封测需求。', 3, '高性能芯片需要更复杂封装。'),
    ('300308', 'SZSE', '000977', 'SZSE', 'beneficiary', 'AI 服务器集群拉动高速光模块需求。', 4, 'AI 集群网络升级需要 800G/1.6T 光模块。')
) as seed(source_ticker, source_exchange, target_ticker, target_exchange, relationship_type, description, strength, evidence)
join companies source on source.ticker = seed.source_ticker and source.exchange = seed.source_exchange
join companies target on target.ticker = seed.target_ticker and target.exchange = seed.target_exchange
on conflict (source_company_id, target_company_id, relationship_type) do update set
  description = excluded.description,
  strength = excluded.strength,
  evidence = excluded.evidence,
  updated_at = now();

with companies as (
  select id, ticker, exchange, name, thesis from public.ai_company_nodes
)
insert into public.ai_theses (company_id, title, thesis, status, confidence, time_horizon)
select
  companies.id,
  seed.title,
  companies.thesis,
  'active',
  seed.confidence,
  seed.time_horizon
from (
  values
    ('NVDA', 'NASDAQ', 'AI compute platform remains the control point', 4, '12-24 months'),
    ('TSM', 'NYSE', 'Advanced foundry is the AI supply chain bottleneck', 4, '24-36 months'),
    ('VRT', 'NYSE', 'Power and cooling are second-order AI capex winners', 4, '12-24 months'),
    ('PLTR', 'NYSE', 'Operational AI software monetizes enterprise agent workflows', 3, '12-24 months'),
    ('688256', 'SSE STAR', '国产 AI 芯片稀缺性需要收入兑现验证', 3, '12-24 months'),
    ('002371', 'SZSE', '国产设备平台受益于半导体主权资本开支', 4, '24-36 months'),
    ('300308', 'SZSE', '高速光模块是 AI 网络升级高弹性环节', 4, '12-24 months')
) as seed(ticker, exchange, title, confidence, time_horizon)
join companies on companies.ticker = seed.ticker and companies.exchange = seed.exchange
on conflict (company_id, title) do update set
  thesis = excluded.thesis,
  status = excluded.status,
  confidence = excluded.confidence,
  time_horizon = excluded.time_horizon,
  updated_at = now();
