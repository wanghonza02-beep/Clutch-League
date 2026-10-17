-- =============================================================================
-- Clutch League — statistiky hráčů na turnaji (migrace č. 9)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, po migracích č. 1–8. Druhé spuštění nic nepokazí.
--
-- Co dělá:
--   Organizátor v portálu (Zapsat výsledky → turnaj → karta týmu) zapíše
--   u každého hráče ze soupisky za celý turnaj odehrané minuty, góly, žluté
--   a červené karty. Statistiky se ukazují i na veřejné stránce odehraného
--   turnaje (tabulka hráčů, nejlepší střelec).
--
--   Statistika patří konkrétnímu hráči ze soupisky (player_id) — i když
--   mají dva hráči stejné jméno. Jméno a číslo se k ní ukládá i přímo,
--   takže zůstane, i když kapitán hráče později ze soupisky smaže
--   (player_id se pak vynuluje). Čte každý, zapisuje jen organizátor.
--
-- Poslední řádek výsledku ukáže počet řádků v nové tabulce (poprvé 0).
-- =============================================================================

create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  player_id uuid references public.players (id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 60),
  shirt_number smallint check (shirt_number between 1 and 99),
  minutes smallint not null default 0 check (minutes between 0 and 2000),
  goals smallint not null default 0 check (goals between 0 and 200),
  yellow_cards smallint not null default 0 check (yellow_cards between 0 and 50),
  red_cards smallint not null default 0 check (red_cards between 0 and 50),
  updated_at timestamptz not null default now(),
  -- Jeden řádek na hráče a turnaj (smazaných hráčů s player_id null může být víc).
  unique (tournament_id, player_id)
);

create index if not exists player_stats_tournament_id_idx on public.player_stats (tournament_id);

-- Práva jako u střelců: číst smí každý, zapisovat jen organizátor.
revoke all on public.player_stats from anon, authenticated;
grant select on public.player_stats to anon, authenticated;
grant insert, update, delete on public.player_stats to authenticated;

alter table public.player_stats enable row level security;

drop policy if exists "Statistiky hráčů jsou veřejné" on public.player_stats;
create policy "Statistiky hráčů jsou veřejné" on public.player_stats
  for select to anon, authenticated
  using (true);

drop policy if exists "Admin zapisuje statistiky hráčů" on public.player_stats;
create policy "Admin zapisuje statistiky hráčů" on public.player_stats
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Kontrola: počet řádků (poprvé 0).
select count(*) as statistiky_hracu from public.player_stats;
