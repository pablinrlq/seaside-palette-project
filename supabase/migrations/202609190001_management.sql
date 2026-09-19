-- Single-store transactional document. Never expose this table or RPCs to anon/authenticated.
create table if not exists public.store_management (
  id integer primary key check (id = 1),
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.store_management enable row level security;
revoke all on public.store_management from anon, authenticated;
grant all on public.store_management to service_role;

create or replace function public.store_read(seed jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  insert into public.store_management(id, state) values (1, seed) on conflict (id) do nothing;
  select state into result from public.store_management where id = 1;
  return result;
end;
$$;

create or replace function public.store_commit(expected_revision integer, next_state jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  if (next_state->>'revision')::integer <> expected_revision + 1 then
    raise exception 'Invalid revision';
  end if;
  update public.store_management set state = next_state, updated_at = now()
  where id = 1 and (state->>'revision')::integer = expected_revision;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.store_read(jsonb) from public, anon, authenticated;
revoke all on function public.store_commit(integer, jsonb) from public, anon, authenticated;
grant execute on function public.store_read(jsonb) to service_role;
grant execute on function public.store_commit(integer, jsonb) to service_role;

