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
