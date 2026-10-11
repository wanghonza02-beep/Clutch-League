-- =============================================================================
-- Clutch League — Winter Clutch je 5+1, soupiska 6 až 10 hráčů (migrace č. 7)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, po migracích č. 1–6. Druhé spuštění nic nepokazí.
--
-- Co dělá:
--   1. Turnaj má vedle nejmenší soupisky i největší (max_roster, výchozí 10).
--      Nové turnaje mají výchozí soupisku 6 až 10 hráčů.
--   2. Winter Clutch 2027: formát 5+1 (5 hráčů v poli + brankář), soupiska
--      aspoň 6 a nejvýš 10 hráčů. V popisu turnaje se „3 na 3“ přepíše na „5+1“.
--   3. Databáze sama nedovolí přidat na soupisku víc hráčů, než dovoluje
--      turnaj s otevřenými přihláškami (když žádný není, nejvýš 10).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Největší soupiska
-- ---------------------------------------------------------------------------

alter table public.tournaments
  add column if not exists max_roster smallint not null default 10;

alter table public.tournaments alter column min_roster set default 6;

alter table public.tournaments drop constraint if exists tournaments_max_roster_check;
alter table public.tournaments
  add constraint tournaments_max_roster_check check (max_roster between 1 and 30);

alter table public.tournaments drop constraint if exists tournaments_roster_range;
alter table public.tournaments
  add constraint tournaments_roster_range check (max_roster >= min_roster);

comment on column public.tournaments.max_roster is
  'Nejvýš hráčů na soupisce týmu. Víc hráčů kapitán nepřidá (trigger players_roster_limit).';

-- ---------------------------------------------------------------------------
-- 2) Winter Clutch 2027: 5+1, soupiska 6–10
-- ---------------------------------------------------------------------------

update public.tournaments
set format = '5+1',
    summary = replace(summary, '3 na 3', '5+1'),
    min_roster = 6,
    max_roster = 10
where slug = 'winter-clutch-2027'
   or (status = 'upcoming' and name ilike 'winter clutch%');

-- ---------------------------------------------------------------------------
-- 3) Hlídání největší soupisky při přidání hráče
--    security definer: počítá i hráče, které by volajícímu RLS neukázala.
--    Řádek týmu se zamkne, aby dvě souběžná přidání nepřelezla limit.
--    Chyba „roster_full:10“ — číslo za dvojtečkou web ukáže v hlášce.
-- ---------------------------------------------------------------------------

create or replace function private.check_roster_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max smallint;
  v_count integer;
begin
  perform 1 from public.teams where id = new.team_id for update;

  select t.max_roster into v_max
  from public.tournaments t
  where t.registration_open
  limit 1;
  v_max := coalesce(v_max, 10);

  select count(*) into v_count from public.players where team_id = new.team_id;
  if v_count >= v_max then
    raise exception 'roster_full:%', v_max using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists players_roster_limit on public.players;
create trigger players_roster_limit
  before insert on public.players
  for each row execute function private.check_roster_limit();

-- Kontrola: Winter Clutch má teď formát 5+1 a soupisku 6–10.
select name, format, min_roster, max_roster, summary
from public.tournaments
where slug = 'winter-clutch-2027'
   or (status = 'upcoming' and name ilike 'winter clutch%');
