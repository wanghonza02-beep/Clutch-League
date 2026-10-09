-- =============================================================================
-- Skutečná data: první turnaj Clutch League Cup, 23. 8. 2026
--
-- Zdroj: dokument „TÝMY KTERÉ HRÁLI 1. TURNAJ + UMÍSTĚNÍ“ (Google Disk, Cluth League).
-- Jen týmy a umístění. Zápasy, góly ani střelci nejsou, web je proto u turnaje
-- vůbec neukazuje. Týmy na 5.–8. místě pořadí nemají, web je uvede jako další účastníky.
--
-- Spusť jednou: Supabase → SQL Editor → New query → vlož → Run. Předtím musí
-- proběhnout migrace 20261012120000_mesto_tymu_nepovinne.sql (město je prázdné).
-- Když tým se stejným názvem už v databázi je (např. s účtem kapitána), použije se.
-- Při druhém spuštění skončí chybou na adrese turnaje a nic nezdvojí.
-- =============================================================================

with tournament as (
  insert into public.tournaments
    (slug, name, edition, starts_on, summary, photo_src, photo_alt, status)
  values
    ('clutch-league-cup-2026', 'Clutch League Cup', 'Léto 2026', '2026-08-23',
     'První turnaj Clutch League. Hrálo osm týmů.',
     '/history/cup-2026-vyhlaseni-tym.jpg', 'Tým Žlutý balet s medailemi a trofejí za 3. místo',
     'completed')
  returning id
),
roster (name, final_rank) as (
  values
    ('FC PRAZHARKA', 1),
    ('Grupac FC', 2),
    ('Žlutý balet', 3),
    ('FC Demonstav', 4),
    ('FK Zbirna', null),
    ('Slow Panters', null),
    ('Storm MC', null),
    ('Strahovští Bombarďáci', null)
),
new_teams as (
  insert into public.teams (name)
  select r.name from roster r
  where not exists (select 1 from public.teams t where lower(t.name) = lower(r.name))
  returning id, name
),
all_teams as (
  select id, name from new_teams
  union all
  select t.id, t.name from public.teams t join roster r on lower(t.name) = lower(r.name)
)
insert into public.tournament_entries (tournament_id, team_id, status, final_rank)
select tournament.id, a.id, 'approved'::public.entry_status, r.final_rank
from tournament
cross join all_teams a
join roster r on lower(r.name) = lower(a.name);

-- Kontrola: týmy turnaje podle pořadí.
select t.name as tym, e.final_rank as misto
from public.tournament_entries e
join public.teams t on t.id = e.team_id
join public.tournaments tr on tr.id = e.tournament_id
where tr.slug = 'clutch-league-cup-2026'
order by e.final_rank nulls last, t.name;
