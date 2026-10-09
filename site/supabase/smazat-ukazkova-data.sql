-- =============================================================================
-- Smazání UKÁZKOVÝCH dat archivu (vložila je dřívější verze seed.sql)
--
-- Spusť, až budeš chtít web bez vymyšlených výsledků: Supabase → SQL Editor →
-- New query → vlož → Run. Skutečná data to nezasáhne:
--   * turnaje se mažou jen podle tří pevných adres (slug) ukázkových turnajů,
--   * týmy se mažou jen ukázkové: bez kapitána a bez jediné přihlášky.
--
-- Turnaj Winter Clutch 2027, účty kapitánů, jejich týmy ani soupisky zůstanou.
-- Mazání nejde vrátit.
-- =============================================================================

-- 1) Ukázkové turnaje (kaskádou i jejich přihlášky, zápasy a střelci).
delete from public.tournaments
where slug in (
  'clutch-league-cup-2026',
  'clutch-street-cup-2026',
  'clutch-autumn-clash-2026'
);

-- 2) Ukázkové týmy: nikdo je nespravuje a nehrají na žádném turnaji.
delete from public.teams t
where t.owner_id is null
  and not exists (select 1 from public.tournament_entries e where e.team_id = t.id)
  and not exists (
    select 1 from public.matches m where m.home_team_id = t.id or m.away_team_id = t.id
  );

-- Kontrola: co v databázi zůstalo.
select 'turnaje' as co, count(*) as pocet from public.tournaments
union all select 'týmy', count(*) from public.teams
union all select 'zápasy', count(*) from public.matches;
