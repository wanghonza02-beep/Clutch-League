# Clutch League × Supabase

Účty kapitánů, přihlášky týmů, soupisky, zápasy s výsledky i archiv turnajů
jsou v databázi Supabase. Tenhle návod projdeš jednou.

## Co je v databázi

| Tabulka | Co drží | Kdo zapisuje |
| --- | --- | --- |
| `auth.users` | přihlašovací údaje (e-mail, hash hesla) | Supabase Auth — registrace na webu |
| `profiles` | jméno, telefon, e-mail, role (kapitán / organizátor) | vzniká sám při registraci; roli mění organizátor |
| `tournaments` | turnaje — stav (připravuje se / otevřené přihlášky / probíhá / odehráno), termín a čas, místo, formát, popis ve 4 jazycích, zobrazení na webu | organizátor (web → Portál → Rozpis turnajů) |
| `teams` | týmy, kód týmu, poznámka | kapitán (přihláška) |
| `tournament_entries` | přihláška týmu na turnaj: stav, skupina, konečné pořadí, postup ze skupiny, co kapitán potvrdil (startovné, podmínky účasti), zaplacení startovného | kapitán podá, organizátor označí platbu a schvaluje |
| `players` | soupisky | kapitán |
| `matches` | rozpis a skóre | organizátor (Rozpis turnajů, Zapsat výsledky) |
| `match_events` | góly a karty u zápasu: kdo, za který tým, v jaké minutě | organizátor (Zapsat výsledky) |
| `scorers` | ruční seznam střelců (jen pro turnaje bez rozepsaných gólů) | organizátor |
| `player_stats` | statistiky hráčů za turnaj: minuty, góly, karty | organizátor (Zapsat výsledky → karta týmu) |

Co kdo smí, hlídá databáze sama (Row Level Security). Kapitán vidí jen svůj tým,
výsledky zapisuje jen organizátor (admin) a veřejnost vidí jen schválené týmy, výsledky
a turnaje, které organizátor zobrazil na webu.

## 1. Databáze (jedenáct migrací + výchozí data)

SQL Editor → New query → vlož obsah souboru → Run. **Každý soubor jen jednou, v tomto pořadí:**

1. `migrations/20261005120000_init.sql` — tabulky a oprávnění
2. `migrations/20261008120000_admin.sql` — administrace pro organizátora
3. `migrations/20261009120000_odhlaseni_tymu.sql` — kapitán může tým z turnaje odhlásit
4. `migrations/20261010120000_vysledky_bez_rozhodciho.sql` — zápis výsledků adminem (góly,
   karty, postup), zrušení role rozhodčí. Na konci vypíše, kdo byl z rozhodčího převeden na admina.
5. `migrations/20261011120000_role_jen_v_supabase.sql` — role už nejde měnit z webu, jen v Supabase
6. `migrations/20261012120000_mesto_tymu_nepovinne.sql` — město týmu nepovinné (archivní týmy bez kapitána)
7. `migrations/20261013120000_winter_5plus1_soupiska.sql` — Winter Clutch je 5+1, soupiska
   6 až 10 hráčů; databáze nepustí na soupisku víc hráčů, než turnaj dovoluje
8. `migrations/20261014120000_prihlasky_oznameni.sql` — přihláška může být zamítnutá (s důvodem),
   oznámení pro kapitány i organizátora (tabulka `notifications`), pojistky rozpisu: tým se zápasy
   nejde z turnaje vyřadit, zápas jen se schválenými týmy a nejdřív v den turnaje. Na konci vypíše,
   kolik zápasů má tým bez schválené přihlášky.
9. `migrations/20261017120000_statistiky_hracu.sql` — statistiky hráčů za turnaj (tabulka `player_stats`)
10. `migrations/20261018120000_rozpis_turnaju.sql` — Rozpis turnajů: stav „probíhá“, čas začátku,
    popis turnaje ve 4 jazycích, příznak „Zobrazit na webu“ (veřejnost vidí jen zobrazené turnaje),
    turnaj s přihláškami nebo zápasy nejde z webu smazat, tým a soupisku spravuje jen kapitán.
    Na konci vypíše turnaje a týmy, které vlastní organizátor.
11. `migrations/20261019120000_startovne_platba.sql` — startovné turnaje (Winter Clutch 2027: 2 700 Kč),
    potvrzení startovného a podmínek účasti u přihlášky, „Startovné přijato“ (schválit jde až po zaplacení,
    zaplacenou přihlášku kapitán sám neodhlásí). Na konci vypíše startovné a přihlášky u turnajů.
12. `seed.sql` — turnaj **Winter Clutch 2027** s otevřenou registrací
13. `prvni-turnaj-2026.sql` — skutečný první turnaj (23. 8. 2026): týmy a umístění, bez zápasů

Pokud databáze ještě obsahuje ukázkový archiv ze starší verze `seed.sql` (vymyšlené
týmy a výsledky), smaž ho: spusť `smazat-ukazkova-data.sql`. Skutečné týmy a turnaje nezasáhne.

## 2. První organizátor

Administrace na webu je dostupná jen roli **admin**. Prvního admina si uděláš sám:

1. Zaregistruj se na webu (`/registrace`) a potvrď e-mail.
2. Supabase → **Table Editor → profiles** → najdi svůj řádek → sloupec **role** změň na `admin` → Save.
3. Na webu se odhlas a znovu přihlas. V navigaci uvidíš **Administrace**.

Role se z webu měnit nedá — dalšího organizátora (nebo vrácení na kapitána) uděláš stejně:
v **Table Editoru → profiles** přepíšeš sloupec **role** (`admin` / `captain`). Dotyčný se pak
na webu odhlásí a znovu přihlásí.

## 3. Klíče do webu

1. **Project Settings → API Keys** (nebo tlačítko **Connect**).
2. Ve složce `site` zkopíruj `.env.example` jako `.env.local` a doplň:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL (bez `/rest/v1/`)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (u starších projektů „anon key“)
3. Restartuj `npm run dev`.

Tajný **service_role / secret** klíč do webu nedávej, není potřeba.

## 4. Adresy pro odkazy v e-mailech

**Authentication → URL Configuration**

- **Site URL:** při vývoji `http://localhost:3000`, před spuštěním změň na skutečnou doménu.
- **Redirect URLs:** přidej `http://localhost:3000/**` a `https://tvoje-domena.cz/**`.

## 5. České e-maily a odesílání

> ⚠️ Na bezplatném tarifu Supabase e-mailové šablony **zamkne**, dokud nenapojíš
> vlastní SMTP. Do té doby chodí výchozí anglické e-maily, jejichž odkaz funguje
> jen ve stejném prohlížeči, ve kterém ses registroval. Web s nimi funguje,
> na zkoušení stačí.

Před spuštěním pro veřejnost je potřeba **vlastní SMTP** (např. Resend s ověřenou
doménou). Vestavěný e-mail Supabase posílá jen na e-maily členů týmu projektu
a jen pár zpráv za hodinu. Po napojení SMTP:

**Authentication → Emails:**

| Šablona | Předmět | Obsah |
| --- | --- | --- |
| Confirm sign up | `Potvrď svůj účet – Clutch League` | `templates/potvrzeni-uctu.html` |
| Reset password | `Nové heslo – Clutch League` | `templates/nove-heslo.html` |

Na zkoušení bez SMTP jde dočasně vypnout potvrzování e-mailu: Authentication →
Sign In / Providers → Email → **Confirm email** (účet se pak přihlásí hned).

## Práce organizátora (web → Portál po přihlášení)

- **Přihlášky:** u turnaje se startovným nejdřív označ „Startovné přijato“ (až platba dorazí na účet
  5815434013/0800, ve zprávě název týmu), pak schval. Vrátit ke schválení nebo odmítnout jde kdykoli;
  vidíš kontakt na kapitána a co při odeslání potvrdil.
  Schválený tým se objeví ve veřejných výsledcích turnaje.
- **Rozpis turnajů:** založit, upravit termín, čas začátku, místo, formát, popis (pro každý
  jazyk zvlášť; název se nepřekládá), startovné (Kč na tým), stav (nadcházející / probíhá /
  odehráno), „Zobrazit na webu“, nejmenší a největší soupisku. Smazat jde jen turnaj bez
  přihlášek a zápasů. Úvodní stránka ukazuje turnaje odsud: nejbližší v kampani s odpočtem,
  další pod ní.
- **Přehled turnaje:** přepínač „Přihlášky otevřené / zavřené“ (otevřené smí mít vždy jen
  jeden turnaj; otevřít jde jen nadcházející turnaj zobrazený na webu).
- **U každého turnaje (Rozpis turnajů):** rozpis zápasů (čas v pražském čase, Clutch Time),
  ruční seznam střelců, ocenění hráče turnaje a brankáře. Zápasy fáze „Skupina…“ se samy
  počítají do tabulky.
- **Zapsat výsledky:** vybereš zápas a zapíšeš skóre, góly (jméno, příjmení, minuta) a žluté
  či červené karty. Body se počítají samy (výhra 3, remíza 1, prohra 0). Když góly rozepíšeš,
  musí sedět se skóre. Střelci a karty na webu se pak spočítají ze zápasů. Tamtéž (karta týmu)
  nastavíš skupinu, umístění, „Postoupil ze skupiny“ a statistiky hráčů.
- **Po turnaji:** u turnaje nastav stav **Odehráno** a objeví se v archivu na `/turnaje`.
- **Organizátor nemá vlastní tým.** Kdo chce hrát, má na to samostatný účet s rolí kapitán.
- **Uživatelé:** přehled všech účtů s kontakty a rolí (jen pro čtení; role se mění v Supabase).

Úvodní stránka, přehled turnajů i detaily výsledků se obnovují samy (nejpozději do
5 minut, změna v administraci i zapsaný výsledek hned).
