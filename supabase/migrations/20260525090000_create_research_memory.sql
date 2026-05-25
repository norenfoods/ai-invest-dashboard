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
