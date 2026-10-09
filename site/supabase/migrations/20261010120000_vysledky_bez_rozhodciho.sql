-- =============================================================================
-- Clutch League — zápis výsledků adminem, bez role rozhodčí (migrace č. 4)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, po migracích č. 1–3.
--
-- Co dělá:
--   1. Role „rozhodčí“ zaniká. Existující rozhodčí se převedou na adminy
--      (seznam převedených vypíše poslední řádek výsledku).
--   2. U zápasů mizí přiřazený rozhodčí — výsledky zapisuje kterýkoli admin.
--   3. Nově: události zápasu (góly a karty s minutou), příznak „postoupil“ u
--      týmu v turnaji a funkce admin_save_match_result, která výsledek uloží
--      najednou a sama zkontroluje oprávnění i to, že góly sedí se skóre.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Rozhodčí → admin
-- ---------------------------------------------------------------------------

create temp table _prevedeni_rozhodci as
  select email, full_name from public.profiles where role::text = 'referee';

update public.profiles set role = 'admin' where role::text = 'referee';

-- ---------------------------------------------------------------------------
-- 2) Zápasy bez rozhodčího
-- ---------------------------------------------------------------------------

drop policy if exists "Rozhodčí vidí své zápasy" on public.matches;
drop policy if exists "Rozhodčí zapisuje skóre svých zápasů" on public.matches;
drop trigger if exists matches_guard_update on public.matches;
drop function if exists private.guard_match_update();
alter table public.matches drop column if exists referee_id;

-- ---------------------------------------------------------------------------
-- 3) Role jen „captain“ a „admin“. Hodnotu z enumu Postgres smazat neumí, typ
--    se proto vytvoří znovu. Funkce current_user_role a dvě politiky, které ho
--    používají, se dočasně odstraní a vrátí beze změny.
-- ---------------------------------------------------------------------------

drop policy if exists "Kapitán zakládá svůj tým" on public.teams;
drop policy if exists "Kapitán přihlašuje svůj tým na otevřený turnaj" on public.tournament_entries;
drop function if exists private.current_user_role();

alter type public.user_role rename to user_role_old;
create type public.user_role as enum ('captain', 'admin');

alter table public.profiles alter column role drop default;
alter table public.profiles
  alter column role type public.user_role using role::text::public.user_role;
alter table public.profiles alter column role set default 'captain';

drop type public.user_role_old;

create function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

grant execute on function private.current_user_role() to authenticated;

create policy "Kapitán zakládá svůj tým" on public.teams
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select private.current_user_role()) = 'captain'
  );

create policy "Kapitán přihlašuje svůj tým na otevřený turnaj" on public.tournament_entries
  for insert to authenticated
  with check (
    (select private.current_user_role()) = 'captain'
    and exists (
      select 1 from public.teams t
      where t.id = tournament_entries.team_id and t.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tournaments tr
      where tr.id = tournament_entries.tournament_id and tr.registration_open
    )
  );

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_role not in ('captain', 'admin') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if p_user = (select auth.uid()) then
    raise exception 'cannot_change_own_role' using errcode = 'P0001';
  end if;

  update public.profiles set role = p_role::public.user_role where id = p_user;
  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4) Postup týmu dál (označuje admin; tabulka skupiny ho zvýrazní)
-- ---------------------------------------------------------------------------

alter table public.tournament_entries
  add column if not exists advanced boolean not null default false;

grant select (advanced) on public.tournament_entries to anon;
grant update (advanced) on public.tournament_entries to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Události zápasu: góly a karty s minutou
-- ---------------------------------------------------------------------------

create type public.match_event_kind as enum ('goal', 'yellow_card', 'red_card');

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  kind public.match_event_kind not null,
  -- Tým, kterému událost patří (u gólu tým, kterému se gól počítá).
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  minute smallint not null check (minute between 0 and 120),
  created_at timestamptz not null default now()
);

create index match_events_match_id_idx on public.match_events (match_id);

-- Událost smí patřit jen týmu, který zápas hraje.
create or replace function private.check_match_event_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.matches m
    where m.id = new.match_id and new.team_id in (m.home_team_id, m.away_team_id)
  ) then
    raise exception 'event_team_not_in_match' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger match_events_check_team
  before insert or update on public.match_events
  for each row execute function private.check_match_event_team();

revoke all on public.match_events from anon, authenticated;
grant select on public.match_events to anon, authenticated;
grant insert, update, delete on public.match_events to authenticated;

alter table public.match_events enable row level security;

create policy "Události zápasů jsou veřejné" on public.match_events
  for select to anon, authenticated
  using (true);

create policy "Admin zapisuje události zápasů" on public.match_events
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 6) Uložení výsledku zápasu najednou (skóre + všechny události).
--    Stávající události zápasu se nahradí odeslanými — tím jde zápis upravit.
--    Skóre null + žádné události = výsledek smazat.
-- ---------------------------------------------------------------------------

create or replace function public.admin_save_match_result(
  p_match uuid,
  p_home_goals smallint,
  p_away_goals smallint,
  p_events jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_match public.matches%rowtype;
  v_event jsonb;
  v_team uuid;
  v_home int := 0;
  v_away int := 0;
  v_goals int := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select * into v_match from public.matches where id = p_match;
  if not found then
    raise exception 'match_not_found' using errcode = 'P0002';
  end if;

  if (p_home_goals is null) <> (p_away_goals is null) then
    raise exception 'score_incomplete' using errcode = '22023';
  end if;

  p_events := coalesce(p_events, '[]'::jsonb);
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'events_not_array' using errcode = '22023';
  end if;
  if p_home_goals is null and jsonb_array_length(p_events) > 0 then
    raise exception 'events_without_score' using errcode = '22023';
  end if;

  for v_event in select value from jsonb_array_elements(p_events) loop
    v_team := (v_event ->> 'team_id')::uuid;
    if v_team is distinct from v_match.home_team_id and v_team is distinct from v_match.away_team_id then
      raise exception 'event_team_not_in_match' using errcode = '23514';
    end if;
    if v_event ->> 'kind' = 'goal' then
      v_goals := v_goals + 1;
      if v_team = v_match.home_team_id then v_home := v_home + 1; else v_away := v_away + 1; end if;
    end if;
  end loop;

  -- Góly nemusí být rozepsané vůbec (zná se jen skóre); když ale jsou,
  -- musí sedět se skóre přesně.
  if v_goals > 0 and (v_home <> p_home_goals or v_away <> p_away_goals) then
    raise exception 'goals_do_not_match_score' using errcode = '22023';
  end if;

  update public.matches
  set home_goals = p_home_goals, away_goals = p_away_goals
  where id = p_match;

  delete from public.match_events where match_id = p_match;

  insert into public.match_events (match_id, kind, team_id, first_name, last_name, minute)
  select
    p_match,
    (e ->> 'kind')::public.match_event_kind,
    (e ->> 'team_id')::uuid,
    trim(e ->> 'first_name'),
    trim(e ->> 'last_name'),
    (e ->> 'minute')::smallint
  from jsonb_array_elements(p_events) as e;
end;
$$;

revoke execute on function public.admin_save_match_result(uuid, smallint, smallint, jsonb) from public, anon;
grant execute on function public.admin_save_match_result(uuid, smallint, smallint, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7) UKÁZKOVÁ DATA archivu: postupující týmy (aby tabulky ukázkových turnajů
--    dál zvýrazňovaly postup). Na skutečná data nesahá — jen tři ukázkové
--    turnaje podle adresy. Po smazání ukázkových dat nemá žádný účinek.
-- ---------------------------------------------------------------------------

update public.tournament_entries e
set advanced = true
from public.tournaments t
where t.id = e.tournament_id
  and (
    (t.slug in ('clutch-league-cup-2026', 'clutch-autumn-clash-2026') and e.final_rank <= 4)
    or (t.slug = 'clutch-street-cup-2026' and e.final_rank <= 2)
  );

-- ---------------------------------------------------------------------------
-- Výsledek: kdo byl převeden z rozhodčího na admina.
-- ---------------------------------------------------------------------------

select coalesce(string_agg(full_name || ' <' || email || '>', ', '), 'nikdo — žádný rozhodčí nebyl')
  as "Rozhodčí převedení na admina"
from _prevedeni_rozhodci;
