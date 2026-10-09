-- =============================================================================
-- Clutch League — administrace pro organizátora (migrace č. 2)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, až po migraci 20261005120000_init.sql.
--
-- Co přidává:
--   * roli „admin“ (organizátor) — vidí a spravuje přihlášky, turnaje, zápasy
--     a uživatele přímo z webu (sekce Portál po přihlášení)
--   * e-mail v profilu, aby organizátor věděl, komu se ozvat
--   * funkci admin_set_role — povýšení uživatele na rozhodčího / admina
--
-- Prvního admina si uděláš sám v Table Editoru: tabulka profiles → svůj řádek →
-- sloupec role = admin. Dál už všechno z webu.
-- =============================================================================

-- Nová hodnota role. Uvnitř téhle migrace se na ni neodkazuje přes typ (jen
-- přes text), protože Postgres novou hodnotu enumu nedovolí použít ve stejné
-- transakci, ve které vznikla.
alter type public.user_role add value if not exists 'admin';

-- ---------------------------------------------------------------------------
-- E-mail v profilu
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists email text not null default '';

update public.profiles p
set email = lower(u.email)
from auth.users u
where u.id = p.id and p.email = '';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 20),
    lower(coalesce(new.email, ''))
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Kdo je admin
-- ---------------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role::text = 'admin'
  );
$$;

grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Admin čte všechno
-- ---------------------------------------------------------------------------

create policy "Admin čte profily" on public.profiles
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admin čte týmy" on public.teams
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admin čte soupisky" on public.players
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admin čte přihlášky" on public.tournament_entries
  for select to authenticated
  using ((select private.is_admin()));

create policy "Admin čte zápasy" on public.matches
  for select to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- Admin zapisuje. Granty jsou širší, ale řádky hlídá RLS — bez politiky pro
-- admina nikdo jiný nezapíše nic. Výjimka: zápasy (viz trigger níže).
-- ---------------------------------------------------------------------------

-- Přihlášky: schválit, zařadit do skupiny, zadat konečné pořadí, odmítnout.
grant update (status, group_label, final_rank), delete on public.tournament_entries to authenticated;

create policy "Admin upravuje přihlášky" on public.tournament_entries
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admin maže přihlášky" on public.tournament_entries
  for delete to authenticated
  using ((select private.is_admin()));

-- Turnaje.
grant insert, update, delete on public.tournaments to authenticated;

create policy "Admin zakládá turnaje" on public.tournaments
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admin upravuje turnaje" on public.tournaments
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admin maže turnaje" on public.tournaments
  for delete to authenticated
  using ((select private.is_admin()));

-- Střelci.
grant insert, update, delete on public.scorers to authenticated;

create policy "Admin zapisuje střelce" on public.scorers
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Zápasy. Rozhodčí už smí měnit skóre svých zápasů; admin navíc cokoli.
grant insert, delete on public.matches to authenticated;
grant update (stage, kickoff, home_team_id, away_team_id, clutch_mode, referee_id)
  on public.matches to authenticated;

create policy "Admin zakládá zápasy" on public.matches
  for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admin upravuje zápasy" on public.matches
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admin maže zápasy" on public.matches
  for delete to authenticated
  using ((select private.is_admin()));

-- Rozhodčí má teď technicky právo měnit i ostatní sloupce svého zápasu (grant
-- je sdílený s adminem). Tenhle trigger mu dovolí jen skóre. Úpravy bez
-- přihlášení uživatele (Table Editor, role postgres) projdou.
create or replace function private.guard_match_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not (select private.is_admin()) then
    if new.tournament_id is distinct from old.tournament_id
      or new.stage is distinct from old.stage
      or new.kickoff is distinct from old.kickoff
      or new.home_team_id is distinct from old.home_team_id
      or new.away_team_id is distinct from old.away_team_id
      or new.clutch_mode is distinct from old.clutch_mode
      or new.referee_id is distinct from old.referee_id
    then
      raise exception 'permission denied: rozhodčí smí měnit jen skóre' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger matches_guard_update
  before update on public.matches
  for each row execute function private.guard_match_update();

-- ---------------------------------------------------------------------------
-- Změna role uživatele. Samostatná funkce, ne přímý zápis do profiles, aby
-- si nikdo nemohl roli změnit sám (sloupec role zůstává pro uživatele zamčený).
-- ---------------------------------------------------------------------------

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
  if p_role not in ('captain', 'referee', 'admin') then
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

revoke execute on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
