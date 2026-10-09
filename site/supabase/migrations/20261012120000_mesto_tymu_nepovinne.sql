-- =============================================================================
-- Město týmu je v databázi nepovinné.
--
-- U týmů z archivu (bez účtu kapitána) město často neznáme a vymýšlet ho
-- nechceme. Web prázdné město nezobrazuje. Kapitán ho při registraci týmu
-- vyplňuje dál, to hlídá formulář (lib/portal/validation.ts).
-- =============================================================================

alter table public.teams drop constraint if exists teams_city_check;
alter table public.teams alter column city set default '';
alter table public.teams add constraint teams_city_check check (char_length(city) <= 60);
