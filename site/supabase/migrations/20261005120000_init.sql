-- =============================================================================
-- Clutch League — databázové schéma (Supabase / Postgres)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, na prázdný projekt. Potom spusť supabase/seed.sql.
--
--   profiles            účet (kapitán / rozhodčí), 1:1 k auth.users
--   tournaments         turnaje — nadcházející i odehrané
--   teams               týmy; tým kapitána má owner_id
--   tournament_entries  přihláška týmu na turnaj: stav, skupina, konečné pořadí
--   players             soupiska týmu
--   matches             zápasy; přidělený rozhodčí do nich zapisuje skóre
--   scorers             střelci turnaje (součty gólů)
--
-- Zabezpečení: každá tabulka má Row Level Security. Web se k databázi hlásí
-- veřejným (publishable) klíčem a přihlášením uživatele, takže co kdo smí,
-- hlídá databáze sama — ne kód webu. Tajný service-role klíč web nepotřebuje.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Typy
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('captain', 'referee');
create type public.entry_status as enum ('pending', 'approved');
create type public.tournament_status as enum ('upcoming', 'completed');
create type public.player_position as enum ('goalkeeper', 'defender', 'midfielder', 'forward');

-- Pomocné funkce žijí ve schématu, které Supabase nevystavuje přes API —
-- nejdou zavolat zvenku, jen z politik a výchozích hodnot sloupců.
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Účty
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text not null default '' check (char_length(phone) <= 20),
  -- Roli „referee“ nastavuje jen organizátor (Table Editor). Uživatel ji
  -- změnit nemůže: sloupec není v jeho UPDATE grantu (viz níže).
  role public.user_role not null default 'captain',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Účet uživatele. Kapitáni vznikají registrací na webu, rozhodčího udělá organizátor změnou role.';

-- Po registraci (auth.users) se automaticky založí profil. Role je vždy
-- „captain“ — nikdy se nebere z metadat, ta si uživatel při registraci
-- může poslat libovolná.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 20)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Role přihlášeného uživatele pro politiky. security definer, aby šla číst
-- i v politikách jiných tabulek bez závislosti na RLS profilů.
create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

grant execute on function private.current_user_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Turnaje
-- ---------------------------------------------------------------------------

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 80),
  edition text not null default '',
  starts_on date not null,
  venue text not null default '',
  format text not null default '',
  match_length text not null default '',
  summary text not null default '',
  photo_src text,
  photo_alt text,
  status public.tournament_status not null default 'upcoming',
  -- Na turnaj s otevřenou registrací se přihlašují týmy z webu.
  registration_open boolean not null default false,
  min_roster smallint not null default 3 check (min_roster between 1 and 30),
  mvp_player text,
  mvp_team_id uuid,
  best_keeper_player text,
  best_keeper_team_id uuid,
  created_at timestamptz not null default now(),
  check (not (registration_open and status = 'completed'))
);

-- Registrace smí být otevřená jen na jeden turnaj najednou.
create unique index tournaments_single_open_registration
  on public.tournaments (registration_open)
  where registration_open;

comment on column public.tournaments.registration_open is
  'Zapni u turnaje, na který se mají týmy přihlašovat. Smí být zapnutá jen u jednoho.';

-- ---------------------------------------------------------------------------
-- Týmy
-- ---------------------------------------------------------------------------

-- Kód týmu CL-XXXX. Bez O/0 a I/1, ať se nedá přepsat špatně. security
-- definer, aby kontrola unikátnosti viděla i týmy jiných kapitánů.
create or replace function private.generate_team_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := 'CL-';
    for i in 1..4 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.teams where code = candidate);
  end loop;
  return candidate;
end;
$$;

grant execute on function private.generate_team_code() to authenticated;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default private.generate_team_code(),
  name text not null check (char_length(name) between 1 and 60),
  city text not null check (char_length(city) between 1 and 60),
  founded_year smallint check (founded_year between 1900 and 2100),
  colors text not null default '' check (char_length(colors) <= 60),
  note text not null default '' check (char_length(note) <= 600),
  -- Kapitán, který tým spravuje. Prázdné u týmů z archivu bez účtu.
  -- unique = jeden kapitán spravuje nejvýš jeden tým.
  owner_id uuid unique references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tournaments
  add constraint tournaments_mvp_team_id_fkey
    foreign key (mvp_team_id) references public.teams (id) on delete set null,
  add constraint tournaments_best_keeper_team_id_fkey
    foreign key (best_keeper_team_id) references public.teams (id) on delete set null;

create table public.tournament_entries (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  -- Přihláška vzniká jako „pending“, schvaluje ji organizátor.
  status public.entry_status not null default 'pending',
  group_label text check (char_length(group_label) <= 10),
  final_rank smallint check (final_rank > 0),
  created_at timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

create index tournament_entries_team_id_idx on public.tournament_entries (team_id);

comment on column public.tournament_entries.status is
  'Schválení přihlášky: změň na „approved“. Schválené týmy se objeví ve veřejných výsledcích.';

-- ---------------------------------------------------------------------------
-- Soupiska
-- ---------------------------------------------------------------------------

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  shirt_number smallint check (shirt_number between 1 and 99),
  position public.player_position not null,
  birth_year smallint check (birth_year between 1900 and 2100),
  -- Kapitán na hřišti. Účet kapitána je teams.owner_id.
  is_captain boolean not null default false,
  created_at timestamptz not null default now()
);

create index players_team_id_idx on public.players (team_id);
-- Číslo dresu je v týmu unikátní, kapitán na hřišti je jen jeden.
create unique index players_team_shirt_number_key
  on public.players (team_id, shirt_number)
  where shirt_number is not null;
create unique index players_team_single_captain_key
  on public.players (team_id)
  where is_captain;

-- ---------------------------------------------------------------------------
-- Zápasy a střelci
-- ---------------------------------------------------------------------------

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  -- „Skupina A“, „Semifinále“, „Finále“… Zápasy fáze „Skupina…“ se
  -- počítají do tabulky, play-off ne.
  stage text not null check (char_length(stage) between 1 and 40),
  counts_for_table boolean generated always as (stage ilike 'skupina%') stored,
  kickoff timestamptz not null,
  home_team_id uuid not null references public.teams (id) on delete restrict,
  away_team_id uuid not null references public.teams (id) on delete restrict,
  home_goals smallint check (home_goals between 0 and 99),
  away_goals smallint check (away_goals between 0 and 99),
  clutch_mode text,
  referee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (home_team_id <> away_team_id),
  -- Skóre je buď celé, nebo žádné.
  check ((home_goals is null) = (away_goals is null))
);

create index matches_tournament_id_idx on public.matches (tournament_id);
create index matches_referee_id_idx on public.matches (referee_id);

create table public.scorers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 120),
  goals smallint not null check (goals >= 0)
);

create index scorers_tournament_id_idx on public.scorers (tournament_id);

-- ---------------------------------------------------------------------------
-- Přihláška týmu — tým a přihláška na otevřený turnaj v jedné transakci.
-- security invoker: platí RLS volajícího, takže projde jen kapitánovi.
-- ---------------------------------------------------------------------------

create or replace function public.register_team(
  p_name text,
  p_city text,
  p_founded_year smallint,
  p_colors text,
  p_note text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tournament uuid;
  v_team uuid;
begin
  select id into v_tournament
  from public.tournaments
  where registration_open
  limit 1;

  if v_tournament is null then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;

  insert into public.teams (name, city, founded_year, colors, note, owner_id)
  values (p_name, p_city, p_founded_year, coalesce(p_colors, ''), coalesce(p_note, ''), (select auth.uid()))
  returning id into v_team;

  insert into public.tournament_entries (tournament_id, team_id)
  values (v_tournament, v_team);

  return v_team;
end;
$$;

revoke execute on function public.register_team(text, text, smallint, text, text) from public, anon;
grant execute on function public.register_team(text, text, smallint, text, text) to authenticated;

-- =============================================================================
-- Oprávnění
--
-- Supabase standardně dává rolím anon/authenticated všechno na všech
-- tabulkách. Tady to nejdřív sebereme a vrátíme jen to, co web opravdu
-- potřebuje — včetně omezení na konkrétní sloupce. Řádky pak hlídá RLS.
-- Role service_role (Dashboard, organizátor) zůstává bez omezení.
-- =============================================================================

revoke all on public.profiles, public.tournaments, public.teams, public.tournament_entries,
  public.players, public.matches, public.scorers from anon, authenticated;

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.scorers enable row level security;

-- profiles: každý vidí a mění jen svůj profil, roli nezmění.
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "Vlastní profil – čtení" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "Vlastní profil – úprava" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- tournaments: veřejné. Zápis jen organizátor přes Dashboard.
grant select on public.tournaments to anon, authenticated;

create policy "Turnaje jsou veřejné" on public.tournaments
  for select to anon, authenticated
  using (true);

-- teams: veřejnost vidí jen název a město týmů se schválenou přihláškou.
-- Kapitán vidí celý svůj tým (včetně kódu a poznámky) a jen ten.
grant select (id, name, city) on public.teams to anon;
grant select on public.teams to authenticated;
grant insert (name, city, founded_year, colors, note, owner_id) on public.teams to authenticated;
grant update (name, city, founded_year, colors, note) on public.teams to authenticated;

create policy "Schválené týmy jsou veřejné" on public.teams
  for select to anon
  using (
    exists (
      select 1 from public.tournament_entries e
      where e.team_id = teams.id and e.status = 'approved'
    )
  );

create policy "Kapitán vidí svůj tým" on public.teams
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Kapitán zakládá svůj tým" on public.teams
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (select private.current_user_role()) = 'captain'
  );

create policy "Kapitán upravuje svůj tým" on public.teams
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- tournament_entries: veřejně jen schválené (archiv). Kapitán vidí své
-- přihlášky a podá novou jen na turnaj s otevřenou registrací. Stav,
-- skupinu ani pořadí nezmění — nejsou v jeho INSERT grantu.
grant select (tournament_id, team_id, status, group_label, final_rank) on public.tournament_entries to anon;
grant select on public.tournament_entries to authenticated;
grant insert (tournament_id, team_id) on public.tournament_entries to authenticated;

create policy "Schválené přihlášky jsou veřejné" on public.tournament_entries
  for select to anon
  using (status = 'approved');

create policy "Kapitán vidí přihlášky svého týmu" on public.tournament_entries
  for select to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = tournament_entries.team_id and t.owner_id = (select auth.uid())
    )
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

-- players: soupisku vidí a mění jen kapitán týmu.
grant select, delete on public.players to authenticated;
grant insert (team_id, first_name, last_name, shirt_number, position, birth_year, is_captain)
  on public.players to authenticated;
grant update (first_name, last_name, shirt_number, position, birth_year, is_captain)
  on public.players to authenticated;

create policy "Kapitán spravuje soupisku – čtení" on public.players
  for select to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

create policy "Kapitán spravuje soupisku – přidání" on public.players
  for insert to authenticated
  with check (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

create policy "Kapitán spravuje soupisku – úprava" on public.players
  for update to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

create policy "Kapitán spravuje soupisku – smazání" on public.players
  for delete to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = players.team_id and t.owner_id = (select auth.uid())
    )
  );

-- matches: rozpis a výsledky jsou veřejné (bez rozhodčího). Rozhodčí vidí
-- své zápasy a mění v nich jen skóre.
grant select (id, tournament_id, stage, counts_for_table, kickoff, home_team_id, away_team_id,
  home_goals, away_goals, clutch_mode) on public.matches to anon;
grant select on public.matches to authenticated;
grant update (home_goals, away_goals) on public.matches to authenticated;

create policy "Zápasy jsou veřejné" on public.matches
  for select to anon
  using (true);

create policy "Rozhodčí vidí své zápasy" on public.matches
  for select to authenticated
  using (referee_id = (select auth.uid()));

create policy "Rozhodčí zapisuje skóre svých zápasů" on public.matches
  for update to authenticated
  using (referee_id = (select auth.uid()))
  with check (referee_id = (select auth.uid()));

-- scorers: veřejné. Zápis jen organizátor.
grant select on public.scorers to anon, authenticated;

create policy "Střelci jsou veřejní" on public.scorers
  for select to anon, authenticated
  using (true);
