-- =============================================================================
-- Clutch League — odhlášení týmu z turnaje (migrace č. 3)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, po migracích 20261005120000_init.sql a 20261008120000_admin.sql.
--
-- Kapitán může svůj tým z turnaje odhlásit sám, ale jen dokud:
--   * má turnaj otevřené přihlášky,
--   * tým nemá v tom turnaji naplánovaný žádný zápas.
-- Potom už odhlášení řeší organizátor (Portál → Přihlášky → Odmítnout).
-- =============================================================================

-- Má tým v turnaji naplánovaný zápas? security definer, protože kapitán kvůli
-- RLS zápasy jiných týmů ani rozpis nevidí — bez toho by kontrola vždy prošla.
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

create policy "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries
  for delete to authenticated
  using (
    exists (
      select 1 from public.teams t
      where t.id = tournament_entries.team_id and t.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tournaments tr
      where tr.id = tournament_entries.tournament_id and tr.registration_open
    )
    and not (select private.team_has_matches(tournament_entries.tournament_id, tournament_entries.team_id))
  );
