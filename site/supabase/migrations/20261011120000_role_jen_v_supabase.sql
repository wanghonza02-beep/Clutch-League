-- =============================================================================
-- Clutch League — role jen v Supabase (migrace č. 5)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se jednou, po migracích č. 1–4.
--
-- Role (admin / kapitán) už nejde měnit z webu. Mění se jen tady v Supabase:
-- Table Editor → profiles → sloupec role. Funkce, přes kterou to šlo z webu,
-- se proto maže. Uživatel sám si roli změnit nemůže dál (sloupec role nemá
-- právo upravovat — smí jen jméno a telefon).
-- =============================================================================

drop function if exists public.admin_set_role(uuid, text);

select 'Hotovo — role se mění jen v Supabase (Table Editor → profiles).' as "Výsledek";
