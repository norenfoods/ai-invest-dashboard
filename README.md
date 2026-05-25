# 中文美股 AI 投资研究仪表盘

一个面向美股研究的中文仪表盘 MVP。项目用于投资研究、风险跟踪和日报整理，不做自动交易，不生成买入、卖出、持有建议。

## 功能模块

- Dashboard 首页：指数概览、自选股排行、持仓摘要、AI 市场摘要、风险预警
- Watchlist 自选股：本地管理自选股，支持添加、删除、重置
- Stock Detail 个股详情：价格、估值、利润率、新闻、AI 个股研究摘要、规则预警
- AI Daily Report：中文日报，包括市场概览、自选股异动、主要风险、明日关注事项
- AI Morning Brief：每日美股晨间研究简报，支持自动生成、Supabase 历史归档、Markdown 导出
- AI Research Memory：长期研究记忆，沉淀每日市场观察、风险变化、板块状态和重点股票状态
- Alerts 预警中心：基于规则引擎生成风险提示
- Portfolio 持仓管理：本地持仓、组合市值、浮动盈亏、仓位占比、持仓风险

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- Financial Modeling Prep API
- OpenAI Responses API
- Supabase Auth + SSR
- Supabase 云端自选股和持仓同步，未登录时使用 localStorage fallback
- 内存缓存 simpleCache

## 本地启动

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

生产构建检查：

```bash
npm run build
npm run start
```

## .env.local 配置

复制示例文件：

```bash
cp .env.local.example .env.local
```

填写：

```env
FMP_API_KEY=你的_FMP_API_KEY
OPENAI_API_KEY=你的_OPENAI_API_KEY
OPENAI_MODEL=可选_OPENAI_MODEL
NEXT_PUBLIC_SUPABASE_URL=你的_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=你的_SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET=你的_CRON_SECRET
```

FMP 和 OpenAI key 是可选的。缺少 key 时项目不会报致命错误，会自动使用 mock fallback。Supabase 环境变量用于登录、云端自选股和持仓同步；未登录时仍会使用浏览器 localStorage fallback。
`SUPABASE_SERVICE_ROLE_KEY` 只用于服务端保存 Morning Brief 归档，不要暴露到前端。`CRON_SECRET` 用于保护 Vercel Cron API。

## Supabase 建表与 RLS

如果 `watchlists` 和 `positions` 表不存在，请在 Supabase SQL Editor 执行：

```sql
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  shares numeric not null check (shares > 0),
  avg_cost numeric not null check (avg_cost >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

alter table public.watchlists enable row level security;
alter table public.positions enable row level security;

create policy "watchlists_select_own"
on public.watchlists for select
to authenticated
using (auth.uid() = user_id);

create policy "watchlists_insert_own"
on public.watchlists for insert
to authenticated
with check (auth.uid() = user_id);

create policy "watchlists_update_own"
on public.watchlists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "watchlists_delete_own"
on public.watchlists for delete
to authenticated
using (auth.uid() = user_id);

create policy "positions_select_own"
on public.positions for select
to authenticated
using (auth.uid() = user_id);

create policy "positions_insert_own"
on public.positions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "positions_update_own"
on public.positions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "positions_delete_own"
on public.positions for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.morning_briefs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text not null,
  content_markdown text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists morning_briefs_date_idx
on public.morning_briefs (date desc);

alter table public.morning_briefs enable row level security;

create policy "morning_briefs_read_authenticated"
on public.morning_briefs for select
to authenticated
using (true);

create table if not exists public.research_memory (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  symbol text,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists research_memory_date_idx
on public.research_memory (date desc);

create index if not exists research_memory_category_idx
on public.research_memory (category);

create index if not exists research_memory_symbol_idx
on public.research_memory (symbol);

create index if not exists research_memory_tags_idx
on public.research_memory using gin (tags);

alter table public.research_memory enable row level security;

create policy "research_memory_read_authenticated"
on public.research_memory for select
to authenticated
using (true);
```

## 数据源说明

- FMP 用于行情、公司资料、财务报表、新闻、指数代理数据
- OpenAI 用于中文研究摘要和 AI 日报
- Morning Brief 每天北京时间 08:00 由 Vercel Cron 调用 `/api/cron/generate-morning-brief` 自动生成，并保存到 Supabase `morning_briefs`
- Research Memory 会在 Morning Brief 保存后写入 Supabase `research_memory`，并在后续简报中读取最近 3/7/30 天上下文
- Supabase Auth 使用邮箱 Magic Link 登录
- 登录后自选股和持仓保存到 Supabase，并通过 RLS 限制用户只能访问自己的数据
- mock data 用于无 key、API 失败、网络失败或数据缺失时的 fallback
- 未登录时自选股和持仓存储在浏览器 localStorage

## AI 安全边界

本项目只生成研究摘要、风险提示和后续观察点。

固定原则：

- 不做自动交易
- 不输出买入、卖出、持有建议
- 不输出目标价
- 不生成交易信号
- 所有 AI 输出必须包含：仅供研究参考，不构成投资建议。

## 部署到 Vercel

1. 将项目推送到 GitHub。
2. 在 Vercel 新建项目并导入该仓库。
3. Framework Preset 选择 Next.js。
4. 在 Vercel Project Settings → Environment Variables 添加：
   - `FMP_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
5. 点击 Deploy。

项目包含 `vercel.json`，会每天 UTC 00:00 触发 Cron，即北京时间 08:00。

部署后如果没有配置 API key，页面仍会使用 mock fallback 正常运行。
