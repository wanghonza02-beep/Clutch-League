-- =============================================================================
-- Clutch League — výchozí data. Spusť po migraci (SQL Editor → Run), jednou.
--
-- Část 1 je skutečná: nadcházející turnaj, na který se přihlašují týmy.
-- Část 2 jsou UKÁZKOVÁ DATA archivu (vymyšlené týmy, výsledky a střelci),
-- aby stránky /turnaje měly co ukázat. Před spuštěním webu je nahraď
-- skutečnými výsledky v Table Editoru, nebo část 2 vůbec nespouštěj.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Část 1: nadcházející turnaj s otevřenou registrací
-- ---------------------------------------------------------------------------

insert into public.tournaments
  (id, slug, name, edition, starts_on, venue, format, match_length, summary, status, registration_open, min_roster)
values
  ('dd461e36-625c-5117-a072-bcd35340f1cb', 'winter-clutch-2027', 'Winter Clutch 2027', 'Zima 2027', '2027-01-10',
   '', '3 na 3', '', 'Zimní turnaj 3 na 3 na menším hřišti, mimo ligovou tabulku.', 'upcoming', true, 3);

-- ---------------------------------------------------------------------------
-- Část 2: UKÁZKOVÁ DATA archivu — nahraď skutečnými výsledky
-- ---------------------------------------------------------------------------

insert into public.teams (id, name, city) values
  ('1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'FC Sklep', 'Praha'),
  ('91a76a02-c480-5551-a57b-5e52c6cc3080', 'Lokomotiva Žižkov', 'Praha'),
  ('dd925f08-3277-503f-a8b4-0d3a19e9b119', 'AC Bagr', 'Kladno'),
  ('dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'Dynamo Nusle', 'Praha'),
  ('37c12213-ad45-5535-ac91-ee0a338b587d', 'SK Výmol', 'Praha'),
  ('ac212029-54db-5906-ac3f-0afacdae03bf', 'FC Pivovar', 'Beroun'),
  ('85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'Real Vršovice', 'Praha'),
  ('91c4517b-4772-53d1-aa62-59e4d7831946', 'Atletico Letná', 'Praha'),
  ('93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'FC Kotelna', 'Praha'),
  ('158e4822-90bc-5386-a16f-9d5236faaa73', 'Spartak Holešovice', 'Praha');

-- Clutch League Cup (21. 6. 2026)
insert into public.tournaments
  (id, slug, name, edition, starts_on, venue, format, match_length, summary, photo_src, photo_alt, status,
   mvp_player, mvp_team_id, best_keeper_player, best_keeper_team_id)
values
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'clutch-league-cup-2026', 'Clutch League Cup', 'Léto 2026', '2026-06-21', 'Praha', '5+1', '15 min',
   'Úplně první turnaj Clutch League. Osm týmů, dvě skupiny a play-off až do finále, které rozhodl Clutch Time.', '/history/cup-2026-vyhlaseni-tym.jpg', 'Tým v černožlutých dresech s medailemi a trofejemi před brankou', 'completed',
   'Tomáš Hruška', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'Ondřej Veselý', '1af4b639-7627-5ab7-abd4-2175eb23ff4a');

insert into public.tournament_entries (tournament_id, team_id, status, group_label, final_rank) values
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'approved', 'A', 1),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '91a76a02-c480-5551-a57b-5e52c6cc3080', 'approved', 'A', 6),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 'approved', 'A', 7),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'approved', 'A', 3),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '37c12213-ad45-5535-ac91-ee0a338b587d', 'approved', 'B', 5),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'ac212029-54db-5906-ac3f-0afacdae03bf', 'approved', 'B', 4),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'approved', 'B', 2),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '91c4517b-4772-53d1-aa62-59e4d7831946', 'approved', 'B', 8);

insert into public.matches (tournament_id, stage, kickoff, home_team_id, away_team_id, home_goals, away_goals, clutch_mode) values
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina A', '2026-06-21 09:00 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '91a76a02-c480-5551-a57b-5e52c6cc3080', 3, 1, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina A', '2026-06-21 09:20 Europe/Prague', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 2, 2, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina A', '2026-06-21 10:00 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 4, 0, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina A', '2026-06-21 10:20 Europe/Prague', '91a76a02-c480-5551-a57b-5e52c6cc3080', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 1, 2, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina A', '2026-06-21 11:00 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 2, 1, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina A', '2026-06-21 11:20 Europe/Prague', '91a76a02-c480-5551-a57b-5e52c6cc3080', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 3, 2, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina B', '2026-06-21 09:40 Europe/Prague', '37c12213-ad45-5535-ac91-ee0a338b587d', 'ac212029-54db-5906-ac3f-0afacdae03bf', 1, 1, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina B', '2026-06-21 10:40 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', '91c4517b-4772-53d1-aa62-59e4d7831946', 2, 0, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina B', '2026-06-21 11:40 Europe/Prague', '37c12213-ad45-5535-ac91-ee0a338b587d', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 0, 2, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina B', '2026-06-21 12:00 Europe/Prague', 'ac212029-54db-5906-ac3f-0afacdae03bf', '91c4517b-4772-53d1-aa62-59e4d7831946', 3, 1, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina B', '2026-06-21 12:20 Europe/Prague', '37c12213-ad45-5535-ac91-ee0a338b587d', '91c4517b-4772-53d1-aa62-59e4d7831946', 2, 1, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Skupina B', '2026-06-21 12:40 Europe/Prague', 'ac212029-54db-5906-ac3f-0afacdae03bf', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 1, 3, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Semifinále', '2026-06-21 14:00 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'ac212029-54db-5906-ac3f-0afacdae03bf', 2, 1, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Semifinále', '2026-06-21 14:30 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 3, 2, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'O 3. místo', '2026-06-21 15:10 Europe/Prague', 'ac212029-54db-5906-ac3f-0afacdae03bf', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 1, 2, null),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'Finále', '2026-06-21 15:45 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 3, 2, 'No Hands');

insert into public.scorers (tournament_id, team_id, player_name, goals) values
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'Tomáš Hruška', 7),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'Jakub Vávra', 6),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'Martin Dolejš', 5),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', 'ac212029-54db-5906-ac3f-0afacdae03bf', 'Petr Kadlec', 4),
  ('cc0bea0a-3bd0-58a1-a7c7-5b63009b7d85', '37c12213-ad45-5535-ac91-ee0a338b587d', 'Ondřej Sýkora', 4);

-- Clutch Street Cup (16. 8. 2026)
insert into public.tournaments
  (id, slug, name, edition, starts_on, venue, format, match_length, summary, photo_src, photo_alt, status,
   mvp_player, mvp_team_id, best_keeper_player, best_keeper_team_id)
values
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'clutch-street-cup-2026', 'Clutch Street Cup', 'Léto 2026', '2026-08-16', 'Praha', '5+1', '15 min',
   'Šest týmů, jedna skupina každý s každým a finále pro první dva. Nováček FC Kotelna sebral pohár favoritovi.', '/history/cup-2026-sprint.jpg', 'Hráč s číslem 95 v černožlutém dresu sprintuje po umělé trávě', 'completed',
   'David Čermák', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'Filip Marek', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e');

insert into public.tournament_entries (tournament_id, team_id, status, group_label, final_rank) values
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'approved', null, 3),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'approved', null, 2),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'approved', null, 1),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '158e4822-90bc-5386-a16f-9d5236faaa73', 'approved', null, 4),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '37c12213-ad45-5535-ac91-ee0a338b587d', 'approved', null, 6),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'approved', null, 5);

insert into public.matches (tournament_id, stage, kickoff, home_team_id, away_team_id, home_goals, away_goals, clutch_mode) values
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 09:00 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 2, 2, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 09:20 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', '37c12213-ad45-5535-ac91-ee0a338b587d', 3, 1, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 09:40 Europe/Prague', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', '158e4822-90bc-5386-a16f-9d5236faaa73', 1, 0, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 10:10 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '37c12213-ad45-5535-ac91-ee0a338b587d', 3, 1, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 10:30 Europe/Prague', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', '158e4822-90bc-5386-a16f-9d5236faaa73', 1, 1, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 10:50 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 2, 1, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 11:20 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '158e4822-90bc-5386-a16f-9d5236faaa73', 1, 2, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 11:40 Europe/Prague', '37c12213-ad45-5535-ac91-ee0a338b587d', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 0, 2, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 12:00 Europe/Prague', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 1, 3, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 13:00 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 2, 0, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 13:20 Europe/Prague', '158e4822-90bc-5386-a16f-9d5236faaa73', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 1, 4, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 13:40 Europe/Prague', '37c12213-ad45-5535-ac91-ee0a338b587d', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 2, 2, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 14:10 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 1, 1, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 14:30 Europe/Prague', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 2, 1, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Skupina', '2026-08-16 14:50 Europe/Prague', '158e4822-90bc-5386-a16f-9d5236faaa73', '37c12213-ad45-5535-ac91-ee0a338b587d', 3, 2, null),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'Finále', '2026-08-16 15:40 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 1, 2, 'No Hands');

insert into public.scorers (tournament_id, team_id, player_name, goals) values
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'Jakub Vávra', 8),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'David Čermák', 6),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'Tomáš Hruška', 5),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', '158e4822-90bc-5386-a16f-9d5236faaa73', 'Lukáš Beneš', 4),
  ('293802d8-29aa-5b3f-a185-c9b18797989d', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'Martin Dolejš', 3);

-- Clutch Autumn Clash (20. 9. 2026)
insert into public.tournaments
  (id, slug, name, edition, starts_on, venue, format, match_length, summary, photo_src, photo_alt, status,
   mvp_player, mvp_team_id, best_keeper_player, best_keeper_team_id)
values
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'clutch-autumn-clash-2026', 'Clutch Autumn Clash', 'Podzim 2026', '2026-09-20', 'Praha', '5+1', '15 min',
   'Poslední turnaj před zimou. Osm týmů ve dvou skupinách, obě semifinále skončila překvapením.', '/history/cup-2026-souboj.jpg', 'Hráč s číslem 17 a soupeř s číslem 11 se vracejí do hry u branky', 'completed',
   'Jakub Vávra', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'Adam Novotný', 'ac212029-54db-5906-ac3f-0afacdae03bf');

insert into public.tournament_entries (tournament_id, team_id, status, group_label, final_rank) values
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'approved', 'A', 1),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'approved', 'A', 3),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 'approved', 'A', 7),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '158e4822-90bc-5386-a16f-9d5236faaa73', 'approved', 'A', 6),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'approved', 'B', 4),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'approved', 'B', 5),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '91c4517b-4772-53d1-aa62-59e4d7831946', 'approved', 'B', 8),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'ac212029-54db-5906-ac3f-0afacdae03bf', 'approved', 'B', 2);

insert into public.matches (tournament_id, stage, kickoff, home_team_id, away_team_id, home_goals, away_goals, clutch_mode) values
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina A', '2026-09-20 09:00 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 2, 0, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina A', '2026-09-20 09:20 Europe/Prague', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', '158e4822-90bc-5386-a16f-9d5236faaa73', 1, 1, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina A', '2026-09-20 10:00 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 1, 2, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina A', '2026-09-20 10:20 Europe/Prague', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', '158e4822-90bc-5386-a16f-9d5236faaa73', 2, 3, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina A', '2026-09-20 11:00 Europe/Prague', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', '158e4822-90bc-5386-a16f-9d5236faaa73', 3, 1, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina A', '2026-09-20 11:20 Europe/Prague', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'dd925f08-3277-503f-a8b4-0d3a19e9b119', 4, 1, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina B', '2026-09-20 09:40 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 2, 1, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina B', '2026-09-20 10:40 Europe/Prague', '91c4517b-4772-53d1-aa62-59e4d7831946', 'ac212029-54db-5906-ac3f-0afacdae03bf', 0, 2, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina B', '2026-09-20 11:40 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '91c4517b-4772-53d1-aa62-59e4d7831946', 3, 0, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina B', '2026-09-20 12:00 Europe/Prague', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'ac212029-54db-5906-ac3f-0afacdae03bf', 2, 2, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina B', '2026-09-20 12:20 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'ac212029-54db-5906-ac3f-0afacdae03bf', 1, 1, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Skupina B', '2026-09-20 12:40 Europe/Prague', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', '91c4517b-4772-53d1-aa62-59e4d7831946', 3, 1, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Semifinále', '2026-09-20 14:00 Europe/Prague', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'ac212029-54db-5906-ac3f-0afacdae03bf', 1, 2, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Semifinále', '2026-09-20 14:30 Europe/Prague', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 2, 3, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'O 3. místo', '2026-09-20 15:10 Europe/Prague', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 3, 2, null),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'Finále', '2026-09-20 15:45 Europe/Prague', 'ac212029-54db-5906-ac3f-0afacdae03bf', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 1, 2, 'No Hands');

insert into public.scorers (tournament_id, team_id, player_name, goals) values
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '85a31faa-26d5-57a4-a16f-0ef76ce9df89', 'Jakub Vávra', 7),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'ac212029-54db-5906-ac3f-0afacdae03bf', 'Petr Kadlec', 6),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '93c8acf0-82f3-5a7e-a7b3-2ba1bcd6ed5e', 'David Čermák', 5),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', '1af4b639-7627-5ab7-abd4-2175eb23ff4a', 'Tomáš Hruška', 4),
  ('67cdcc01-1d0b-534e-a875-b59e300687c2', 'dcfbfcdf-c535-5ba1-ac36-ddbd8711cf55', 'Vojtěch Horák', 3);

-- Postupující týmy ukázkových turnajů (sloupec advanced přidává migrace č. 4).
update public.tournament_entries e
set advanced = true
from public.tournaments t
where t.id = e.tournament_id
  and (
    (t.slug in ('clutch-league-cup-2026', 'clutch-autumn-clash-2026') and e.final_rank <= 4)
    or (t.slug = 'clutch-street-cup-2026' and e.final_rank <= 2)
  );
