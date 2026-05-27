create or replace function public.refresh_research_memory_for_date(
  target_date date,
  items jsonb
)
returns table (
  id uuid,
  date date,
  category text,
  symbol text,
  title text,
  content text,
  tags text[],
  created_at timestamptz
)
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(
    hashtext('research_memory:' || target_date::text)
  );

  delete from public.research_memory as rm
  where rm.date = target_date
    and (
      rm.category in (
        'daily_observation',
        'risk_change',
        'sector_state',
        'stock_state',
        'market_regime',
        'narrative_evolution',
        'thesis_update',
        'earnings_memory',
        'supply_chain_change'
      )
      or rm.memory_type in (
        'daily_observation',
        'risk_change',
        'sector_state',
        'stock_state',
        'market_regime',
        'narrative_evolution',
        'thesis_update',
        'earnings_memory',
        'supply_chain_change'
      )
    );

  return query
  with inserted as (
    insert into public.research_memory (
      date,
      category,
      symbol,
      title,
      content,
      tags,
      company_id,
      narrative_id,
      thesis_id,
      memory_type
    )
    select
      target_date,
      item.value ->> 'category',
      nullif(item.value ->> 'symbol', ''),
      item.value ->> 'title',
      item.value ->> 'content',
      coalesce(
        array(
          select jsonb_array_elements_text(
            coalesce(item.value -> 'tags', '[]'::jsonb)
          )
        ),
        '{}'
      ),
      nullif(item.value ->> 'company_id', '')::uuid,
      nullif(item.value ->> 'narrative_id', '')::uuid,
      nullif(item.value ->> 'thesis_id', '')::uuid,
      nullif(item.value ->> 'memory_type', '')
    from jsonb_array_elements(items) as item(value)
    returning
      public.research_memory.id,
      public.research_memory.date,
      public.research_memory.category,
      public.research_memory.symbol,
      public.research_memory.title,
      public.research_memory.content,
      public.research_memory.tags,
      public.research_memory.created_at
  )
  select
    inserted.id,
    inserted.date,
    inserted.category,
    inserted.symbol,
    inserted.title,
    inserted.content,
    inserted.tags,
    inserted.created_at
  from inserted;
end;
$$;

revoke execute on function public.refresh_research_memory_for_date(date, jsonb)
from public, anon, authenticated;

grant execute on function public.refresh_research_memory_for_date(date, jsonb)
to service_role;
