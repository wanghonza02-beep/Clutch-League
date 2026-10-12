-- =============================================================================
-- Clutch League — zamítnuté přihlášky, oznámení a pojistky rozpisu (migrace č. 8)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, po migracích č. 1–7. Druhé spuštění nic nepokazí.
-- Obsahuje i všechno z migrace č. 3 (odhlášení týmu kapitánem) — když č. 3
-- v databázi chybí, tahle ji doplní.
--
-- Co dělá:
--   1. Přihláška může být „zamítnutá“, s důvodem pro kapitána. Dřív se
--      zamítnutá přihláška smazala a kapitán se nic nedozvěděl.
--   2. Oznámení. Kapitán uvidí na webu, že organizátor jeho přihlášku schválil,
--      zamítl, vrátil ke schválení nebo smazal. Organizátor uvidí nové
--      přihlášky a odhlášení týmů. Oznámení vznikají v databázi samy, takže
--      fungují, ať se změna udělá na webu, nebo tady v Supabase.
--   3. Pojistky, aby rozpis zápasů nikdy neukazoval na tým, který na turnaji není:
--        * tým se zápasy nejde z turnaje vyřadit (zamítnout, vrátit, smazat),
--          dokud má zápasy — organizátor je musí smazat (web to udělá najednou),
--        * zápas jde založit jen se schválenými týmy a nejdřív v den turnaje,
--        * týmy zápasu nejde vyměnit, když má zápas zapsané góly nebo karty.
--   4. Funkce pro web: změna stavu přihlášky a smazání přihlášky, obojí včetně
--      smazání zápasů týmu v jednom kroku (jen když nemají výsledek).
--   5. Jazyk účtu — e-maily s oznámením přijdou v jazyce, ve kterém se kapitán
--      registroval.
--
-- Poslední řádek výsledku ukáže, kolik zápasů má tým bez schválené přihlášky
-- (ty v administraci svítí červeně — oprav je, nebo smaž).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Stav „zamítnuto“ a důvod
--    Nová hodnota enumu se v téhle migraci používá jen jako text (status::text),
--    protože Postgres ji ve stejné transakci, ve které vznikla, jinak nepustí.
-- ---------------------------------------------------------------------------

alter type public.entry_status add value if not exists 'rejected';

alter table public.tournament_entries
  add column if not exists status_note text not null default '',
  add column if not exists status_changed_at timestamptz;

alter table public.tournament_entries drop constraint if exists tournament_entries_status_note_check;
alter table public.tournament_entries
  add constraint tournament_entries_status_note_check check (char_length(status_note) <= 500);

comment on column public.tournament_entries.status_note is
  'Důvod zamítnutí — vidí ho kapitán týmu a organizátor, veřejnost ne.';
comment on column public.tournament_entries.status_changed_at is
  'Kdy organizátor naposledy změnil stav přihlášky.';

-- Organizátor zapisuje i důvod a čas rozhodnutí. Veřejnost (anon) na nové
-- sloupce právo nemá, důvod zamítnutí tak zůstává soukromý.
grant update (status_note, status_changed_at) on public.tournament_entries to authenticated;

-- Má tým v turnaji zápas? Funkce je z migrace č. 3 (odhlášení týmu) — tady
-- znovu, protože bez ní by tahle migrace spadla v databázi, kde č. 3 neběžela.
-- security definer: kapitán kvůli RLS cizí zápasy nevidí, kontrola by jinak vždy prošla.
create or replace function private.team_has_matches(p_tournament uuid, p_team uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.tournament_id = p_tournament
      and (m.home_team_id = p_team or m.away_team_id = p_team)
  );
$$;

grant execute on function private.team_has_matches(uuid, uuid) to authenticated;

-- Kapitán se z turnaje odhlásí sám jen u přihlášky, která není zamítnutá —
-- jinak by zamítnutí obešel odhlášením a novou přihláškou. (Politika je
-- z migrace č. 3; když č. 3 neběžela, vznikne tady.)
drop policy if exists "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries;
create policy "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries
  for delete to authenticated
  using (
    status::text <> 'rejected'
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
-- 2) Pojistka přihlášek: tým se zápasy z turnaje nevypadne
-- ---------------------------------------------------------------------------

create or replace function private.guard_entry_with_matches()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Maže se celý turnaj (kaskáda) — zápasy padají s ním, není co hlídat.
  if not exists (select 1 from public.tournaments where id = old.tournament_id) then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status or new.status::text = 'approved' then
      return new;
    end if;
  end if;

  if private.team_has_matches(old.tournament_id, old.team_id) then
    raise exception 'entry_has_matches'
      using errcode = 'P0001',
            hint = 'Tým má na turnaji zápasy v rozpisu. Nejdřív je smaž, nebo v nich vyber jiný tým.';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists tournament_entries_guard_matches on public.tournament_entries;
create trigger tournament_entries_guard_matches
  before update of status or delete on public.tournament_entries
  for each row execute function private.guard_entry_with_matches();

-- ---------------------------------------------------------------------------
-- 3) Pojistka zápasů: jen schválené týmy, nejdřív v den turnaje, góly a karty
--    zůstávají u týmů, kterým patří. Zápis skóre (home_goals, away_goals)
--    trigger nespouští — výsledek jde zapsat i u starších zápasů.
-- ---------------------------------------------------------------------------

create or replace function private.guard_match_teams()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_starts date;
begin
  select starts_on into v_starts from public.tournaments where id = new.tournament_id;
  if v_starts is not null and (new.kickoff at time zone 'Europe/Prague')::date < v_starts then
    raise exception 'kickoff_before_tournament'
      using errcode = 'P0001', hint = 'Výkop nemůže být dřív než v den turnaje.';
  end if;

  if not exists (
    select 1 from public.tournament_entries e
    where e.tournament_id = new.tournament_id and e.team_id = new.home_team_id and e.status::text = 'approved'
  ) or not exists (
    select 1 from public.tournament_entries e
    where e.tournament_id = new.tournament_id and e.team_id = new.away_team_id and e.status::text = 'approved'
  ) then
    raise exception 'match_team_not_approved'
      using errcode = 'P0001', hint = 'Zápas může hrát jen tým se schválenou přihláškou na tenhle turnaj.';
  end if;

  if tg_op = 'UPDATE'
    and (new.home_team_id <> old.home_team_id or new.away_team_id <> old.away_team_id)
    and exists (select 1 from public.match_events where match_id = new.id)
  then
    raise exception 'match_has_events'
      using errcode = 'P0001', hint = 'Zápas má zapsané góly nebo karty. Nejdřív smaž výsledek.';
  end if;

  return new;
end;
$$;

drop trigger if exists matches_guard_teams on public.matches;
create trigger matches_guard_teams
  before insert or update of tournament_id, home_team_id, away_team_id, kickoff on public.matches
  for each row execute function private.guard_match_teams();

-- ---------------------------------------------------------------------------
-- 4) Oznámení
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  -- Komu oznámení patří.
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (
    kind in (
      'entry_submitted',  -- organizátorovi: nová přihláška
      'entry_withdrawn',  -- organizátorovi: kapitán tým z turnaje odhlásil
      'entry_approved',   -- kapitánovi: přihláška schválená
      'entry_rejected',   -- kapitánovi: přihláška zamítnutá (důvod v note)
      'entry_returned',   -- kapitánovi: přihláška vrácená ke schválení
      'entry_removed'     -- kapitánovi: organizátor přihlášku smazal
    )
  ),
  tournament_id uuid references public.tournaments (id) on delete cascade,
  team_id uuid references public.teams (id) on delete cascade,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

comment on table public.notifications is
  'Oznámení pro uživatele webu. Vznikají samy (triggery na přihláškách), web je jen čte a označuje jako přečtené.';

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.notifications enable row level security;

drop policy if exists "Vlastní oznámení – čtení" on public.notifications;
create policy "Vlastní oznámení – čtení" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Vlastní oznámení – přečteno" on public.notifications;
create policy "Vlastní oznámení – přečteno" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function private.notify(
  p_user uuid,
  p_kind text,
  p_tournament uuid,
  p_team uuid,
  p_note text default ''
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, tournament_id, team_id, note)
  values (p_user, p_kind, p_tournament, p_team, left(coalesce(p_note, ''), 500));
$$;

create or replace function private.notify_admins(p_kind text, p_tournament uuid, p_team uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, kind, tournament_id, team_id)
  select id, p_kind, p_tournament, p_team from public.profiles where role::text = 'admin';
$$;

-- Kdo změnu udělal: auth.uid() je přihlášený uživatel webu. Prázdné = změna
-- přímo v Supabase (organizátor) — i o té se kapitán dozví.
create or replace function private.entry_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_actor uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    -- Jen přihláška od kapitána (čeká na schválení). Hromadné vložení
    -- archivu (rovnou schválené) organizátora nezasype oznámeními.
    if new.status::text = 'pending' then
      perform private.notify_admins('entry_submitted', new.tournament_id, new.team_id);
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;
    select owner_id into v_owner from public.teams where id = new.team_id;
    if v_owner is not null and v_owner is distinct from v_actor then
      perform private.notify(
        v_owner,
        case new.status::text
          when 'approved' then 'entry_approved'
          when 'rejected' then 'entry_rejected'
          else 'entry_returned'
        end,
        new.tournament_id,
        new.team_id,
        case when new.status::text = 'rejected' then new.status_note else '' end
      );
    end if;
    return new;
  end if;

  -- DELETE. Maže se celý turnaj nebo tým (kaskáda) — nic neoznamovat.
  if not exists (select 1 from public.tournaments where id = old.tournament_id) then
    return old;
  end if;
  select owner_id into v_owner from public.teams where id = old.team_id;
  if v_owner is null then
    return old;
  end if;
  if v_owner = v_actor then
    perform private.notify_admins('entry_withdrawn', old.tournament_id, old.team_id);
  else
    perform private.notify(v_owner, 'entry_removed', old.tournament_id, old.team_id, '');
  end if;
  return old;
end;
$$;

drop trigger if exists tournament_entries_notify on public.tournament_entries;
create trigger tournament_entries_notify
  after insert or update of status or delete on public.tournament_entries
  for each row execute function private.entry_notifications();

-- ---------------------------------------------------------------------------
-- 5) Funkce pro web: stav přihlášky a smazání přihlášky
--    security invoker: platí RLS volajícího, projde jen organizátorovi.
--    Zápasy týmu smaže jen na výslovný pokyn (p_delete_matches) a jen když
--    žádný z nich nemá výsledek. Vrací počet smazaných zápasů.
-- ---------------------------------------------------------------------------

create or replace function private.clear_team_matches(p_tournament uuid, p_team uuid, p_delete boolean)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.matches m
  where m.tournament_id = p_tournament and (m.home_team_id = p_team or m.away_team_id = p_team);

  if v_count = 0 then
    return 0;
  end if;
  if not p_delete then
    raise exception 'entry_has_matches:%', v_count using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.matches m
    where m.tournament_id = p_tournament
      and (m.home_team_id = p_team or m.away_team_id = p_team)
      and m.home_goals is not null
  ) then
    raise exception 'entry_has_results' using errcode = 'P0001';
  end if;

  delete from public.matches m
  where m.tournament_id = p_tournament and (m.home_team_id = p_team or m.away_team_id = p_team);
  return v_count;
end;
$$;

grant execute on function private.clear_team_matches(uuid, uuid, boolean) to authenticated;

create or replace function public.admin_set_entry_status(
  p_tournament uuid,
  p_team uuid,
  p_status text,
  p_note text default '',
  p_delete_matches boolean default false
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.tournament_entries where tournament_id = p_tournament and team_id = p_team
  ) then
    raise exception 'entry_not_found' using errcode = 'P0002';
  end if;

  if p_status <> 'approved' then
    v_deleted := private.clear_team_matches(p_tournament, p_team, p_delete_matches);
  end if;

  update public.tournament_entries
  set status = p_status::public.entry_status,
      status_note = case when p_status = 'rejected' then left(trim(coalesce(p_note, '')), 500) else '' end,
      status_changed_at = now()
  where tournament_id = p_tournament and team_id = p_team;

  return v_deleted;
end;
$$;

revoke execute on function public.admin_set_entry_status(uuid, uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_set_entry_status(uuid, uuid, text, text, boolean) to authenticated;

create or replace function public.admin_remove_entry(
  p_tournament uuid,
  p_team uuid,
  p_delete_matches boolean default false
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not (select private.is_admin()) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.tournament_entries where tournament_id = p_tournament and team_id = p_team
  ) then
    raise exception 'entry_not_found' using errcode = 'P0002';
  end if;

  v_deleted := private.clear_team_matches(p_tournament, p_team, p_delete_matches);
  delete from public.tournament_entries where tournament_id = p_tournament and team_id = p_team;
  return v_deleted;
end;
$$;

revoke execute on function public.admin_remove_entry(uuid, uuid, boolean) from public, anon;
grant execute on function public.admin_remove_entry(uuid, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Jazyk účtu (pro e-maily s oznámením)
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists locale text not null default 'cs';
alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('cs', 'en', 'uk', 'sk'));

update public.profiles p
set locale = u.raw_user_meta_data ->> 'locale'
from auth.users u
where u.id = p.id
  and (u.raw_user_meta_data ->> 'locale') in ('cs', 'en', 'uk', 'sk')
  and p.locale is distinct from (u.raw_user_meta_data ->> 'locale');

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email, locale)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 20),
    lower(coalesce(new.email, '')),
    case
      when (new.raw_user_meta_data ->> 'locale') in ('cs', 'en', 'uk', 'sk') then new.raw_user_meta_data ->> 'locale'
      else 'cs'
    end
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Výsledek: zápasy, které ukazují na tým bez schválené přihlášky.
-- ---------------------------------------------------------------------------

select count(*) as "Zápasy s týmem bez schválené přihlášky (oprav v administraci)"
from public.matches m
where not exists (
    select 1 from public.tournament_entries e
    where e.tournament_id = m.tournament_id and e.team_id = m.home_team_id and e.status::text = 'approved'
  )
  or not exists (
    select 1 from public.tournament_entries e
    where e.tournament_id = m.tournament_id and e.team_id = m.away_team_id and e.status::text = 'approved'
  );
