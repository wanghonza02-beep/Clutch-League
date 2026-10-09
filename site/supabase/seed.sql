-- =============================================================================
-- Clutch League — výchozí data. Spusť po migraci (SQL Editor → Run), jednou.
--
-- Jen nadcházející turnaj, na který se přihlašují týmy. Odehrané turnaje a
-- jejich výsledky se zadávají v Portálu (Turnaje, Zapsat výsledky), ne sem.
-- Žádná vymyšlená data: co je v databázi, je vidět na veřejném webu.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Nadcházející turnaj s otevřenou registrací
-- ---------------------------------------------------------------------------

insert into public.tournaments
  (id, slug, name, edition, starts_on, venue, format, match_length, summary, status, registration_open, min_roster)
values
  ('dd461e36-625c-5117-a072-bcd35340f1cb', 'winter-clutch-2027', 'Winter Clutch 2027', 'Zima 2027', '2027-01-10',
   '', '3 na 3', '', 'Zimní turnaj 3 na 3 na menším hřišti, mimo ligovou tabulku.', 'upcoming', true, 3);
