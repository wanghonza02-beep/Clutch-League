-- =============================================================================
-- Clutch League — Rozpis turnajů (migrace č. 10)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se po migracích č. 1–9. Druhé spuštění nic nepokazí.
--
-- Co dělá:
--   1. Turnaj má čtyři stavy: připravuje se / otevřené přihlášky / probíhá /
--      odehráno. Nový je „probíhá“ (status in_progress). „Připravuje se“
--      a „otevřené přihlášky“ jsou dál status upcoming + registration_open.
--   2. Čas začátku turnaje (start_time, pražský čas). Úvodní stránka k němu
--      počítá odpočet.
--   3. Popis turnaje ve čtyřech jazycích: summary (čeština, jako dosud)
--      a nově summary_en, summary_uk, summary_sk. Název turnaje se nepřekládá.
--   4. Příznak „Zobrazit na webu“ (published). Veřejnost vidí jen zobrazené
--      turnaje, organizátor všechny, kapitán i turnaje, na které je jeho tým
--      přihlášený. Oba stávající turnaje zůstanou zobrazené.
--      Přihlášky jdou otevřít jen u nadcházejícího zobrazeného turnaje.
--   5. Turnaj, který má přihlášky nebo zápasy, nejde z webu smazat. Z Table
--      Editoru (bez přihlášení na webu) to jde dál — smaže se i se vším.
--   6. Tým a soupisku z webu spravuje jen kapitán. Organizátor vlastní tým
--      nemá — chce-li hrát, má na to samostatný kapitánský účet.
--
-- Poslední řádek výsledku ukáže turnaje a týmy, které vlastní organizátor
-- (ty v Table Editoru převeď na kapitánský účet: teams → owner_id).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Stav „probíhá“
--    Nová hodnota enumu se v téhle migraci používá jen jako text (status::text),
--    protože Postgres ji ve stejné transakci, ve které vznikla, jinak nepustí.
-- ---------------------------------------------------------------------------

alter type public.tournament_status add value if not exists 'in_progress';

-- ---------------------------------------------------------------------------
-- 2)–4) Nové sloupce turnaje
-- ---------------------------------------------------------------------------

alter table public.tournaments
  add column if not exists start_time time,
  add column if not exists summary_en text not null default '',
  add column if not exists summary_uk text not null default '',
  add column if not exists summary_sk text not null default '',
  add column if not exists published boolean not null default true;

alter table public.tournaments drop constraint if exists tournaments_summary_length;
alter table public.tournaments
  add constraint tournaments_summary_length check (
    char_length(summary) <= 600
    and char_length(summary_en) <= 600
    and char_length(summary_uk) <= 600
    and char_length(summary_sk) <= 600
  );

comment on column public.tournaments.start_time is
  'Čas začátku turnaje (pražský čas). Prázdné = odpočet běží k prvnímu výkopu, jinak k začátku dne.';
comment on column public.tournaments.summary is 'Popis turnaje česky (úvodní stránka, popis pro vyhledávače).';
comment on column public.tournaments.summary_en is 'Popis turnaje anglicky. Prázdné = v angličtině se popis neukáže.';
comment on column public.tournaments.summary_uk is 'Popis turnaje ukrajinsky. Prázdné = v ukrajinštině se popis neukáže.';
comment on column public.tournaments.summary_sk is 'Popis turnaje slovensky. Prázdné = ve slovenštině se popis neukáže.';
comment on column public.tournaments.published is
  'Zobrazit na webu (úvodní stránka, archiv). Vypnuté = turnaj vidí jen organizátor a přihlášené týmy.';

-- Přihlášky smí být otevřené jen u nadcházejícího turnaje, který je na webu
-- vidět. Nahrazuje starší podmínku „odehraný turnaj nemá otevřené přihlášky“.
alter table public.tournaments drop constraint if exists tournaments_check;
alter table public.tournaments drop constraint if exists tournaments_registration_check;
alter table public.tournaments
  add constraint tournaments_registration_check
    check (not registration_open or (status::text = 'upcoming' and published));

-- ---------------------------------------------------------------------------
-- 4) Kdo turnaje vidí
-- ---------------------------------------------------------------------------

drop policy if exists "Turnaje jsou veřejné" on public.tournaments;
drop policy if exists "Zobrazené turnaje jsou veřejné" on public.tournaments;
create policy "Zobrazené turnaje jsou veřejné" on public.tournaments
  for select to anon, authenticated
  using (published);

drop policy if exists "Admin čte všechny turnaje" on public.tournaments;
create policy "Admin čte všechny turnaje" on public.tournaments
  for select to authenticated
  using ((select private.is_admin()));

-- Kapitán vidí turnaj, na který je jeho tým přihlášený, i když není zobrazený
-- na webu — a turnaj, o kterém má oznámení (např. smazaná přihláška).
-- Kontrola je ve funkci (security definer), ne přímo v politice: politiky
-- přihlášek se odkazují na turnaje, a kdyby se politika turnajů odkazovala
-- zpátky na přihlášky, Postgres by přihlášení i odhlášení týmu odmítl
-- („infinite recursion detected in policy“).
create or replace function private.is_own_tournament(p_tournament uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournament_entries e
    join public.teams t on t.id = e.team_id
    where e.tournament_id = p_tournament and t.owner_id = (select auth.uid())
  )
  or exists (
    select 1 from public.notifications n
    where n.tournament_id = p_tournament and n.user_id = (select auth.uid())
  );
$$;

grant execute on function private.is_own_tournament(uuid) to authenticated;

drop policy if exists "Kapitán vidí turnaje svého týmu" on public.tournaments;
create policy "Kapitán vidí turnaje svého týmu" on public.tournaments
  for select to authenticated
  using (private.is_own_tournament(id));

-- Zápis zůstává jen organizátorovi (politiky „Admin zakládá / upravuje / maže
-- turnaje“ z migrace č. 2 se nemění).

-- ---------------------------------------------------------------------------
-- 5) Turnaj s přihláškami nebo zápasy nejde z webu smazat
--    Kaskáda by jinak potichu smazala přihlášky týmů (kapitán by se nic
--    nedozvěděl) i výsledky. Organizátor nejdřív smaže přihlášky (kapitáni
--    dostanou oznámení) a zápasy. Bez přihlášeného uživatele webu (Table
--    Editor, role postgres) smazání projde i s daty.
-- ---------------------------------------------------------------------------

create or replace function private.guard_tournament_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return old;
  end if;
  if exists (select 1 from public.tournament_entries where tournament_id = old.id)
    or exists (select 1 from public.matches where tournament_id = old.id)
  then
    raise exception 'tournament_has_data'
      using errcode = 'P0001',
            hint = 'Turnaj má přihlášky nebo zápasy. Nejdřív je smaž, nebo turnaj jen skryj z webu.';
  end if;
  return old;
end;
$$;

drop trigger if exists tournaments_guard_delete on public.tournaments;
create trigger tournaments_guard_delete
  before delete on public.tournaments
  for each row execute function private.guard_tournament_delete();

-- ---------------------------------------------------------------------------
-- 6) Tým a soupisku spravuje jen kapitán
--    Dřív stačilo tým vlastnit (owner_id) — i organizátor s vlastním týmem.
--    Zakládání týmu a přihláška na turnaj byly kapitánům vyhrazené už dřív.
-- ---------------------------------------------------------------------------

drop policy if exists "Kapitán upravuje svůj tým" on public.teams;
create policy "Kapitán upravuje svůj tým" on public.teams
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select private.current_user_role()) = 'captain')
  with check (owner_id = (select auth.uid()) and (select private.current_user_role()) = 'captain');

drop policy if exists "Kapitán spravuje soupisku – přidání" on public.players;
create policy "Kapitán spravuje soupisku – přidání" on public.players
  for insert to authenticated
  with check (
    (select private.current_user_role()) = 'captain'
    and exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Kapitán spravuje soupisku – úprava" on public.players;
create policy "Kapitán spravuje soupisku – úprava" on public.players
  for update to authenticated
  using (
    (select private.current_user_role()) = 'captain'
    and exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  )
  with check (
    (select private.current_user_role()) = 'captain'
    and exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Kapitán spravuje soupisku – smazání" on public.players;
create policy "Kapitán spravuje soupisku – smazání" on public.players
  for delete to authenticated
  using (
    (select private.current_user_role()) = 'captain'
    and exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

-- Odhlášení týmu z turnaje (politika z migrací č. 3 a 8) — navíc jen kapitán.
drop policy if exists "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries;
create policy "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries
  for delete to authenticated
  using (
    (select private.current_user_role()) = 'captain'
    and status::text <> 'rejected'
    and exists (
      select 1 from public.teams t
      where t.id = tournament_entries.team_id and t.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tournaments tr
      where tr.id = tournament_entries.tournament_id and tr.registration_open
    )
    and not (select private.team_has_matches(tournament_entries.tournament_id, tournament_entries.team_id))
  );

-- ---------------------------------------------------------------------------
-- Výsledek: turnaje a týmy organizátora
-- ---------------------------------------------------------------------------

select
  (select string_agg(name || ' (' || status::text || case when published then ', na webu' else ', skrytý' end || ')', ', ' order by starts_on)
   from public.tournaments) as "Turnaje",
  (select coalesce(string_agg(t.name || ' – ' || p.email, ', '), 'žádný')
   from public.teams t
   join public.profiles p on p.id = t.owner_id
   where p.role::text = 'admin') as "Týmy, které vlastní organizátor (převeď na kapitána)";
