# Clutch League × Supabase

Účty kapitánů, přihlášky týmů, soupisky, zápasy s výsledky i archiv turnajů
jsou v databázi Supabase. Tenhle návod projdeš jednou.

## Co je v databázi

| Tabulka | Co drží | Kdo zapisuje |
| --- | --- | --- |
| `auth.users` | přihlašovací údaje (e-mail, hash hesla) | Supabase Auth — registrace na webu |
| `profiles` | jméno, telefon, e-mail, role (kapitán / organizátor) | vzniká sám při registraci; roli mění organizátor |
| `tournaments` | turnaje — nadcházející i odehrané | organizátor (web → Portál → Turnaje) |
| `teams` | týmy, kód týmu, poznámka | kapitán (přihláška) |
| `tournament_entries` | přihláška týmu na turnaj: stav, skupina, konečné pořadí, postup ze skupiny | kapitán podá, organizátor schvaluje |
| `players` | soupisky | kapitán |
| `matches` | rozpis a skóre | organizátor (Turnaje, Zapsat výsledky) |
| `match_events` | góly a karty u zápasu: kdo, za který tým, v jaké minutě | organizátor (Zapsat výsledky) |
| `scorers` | ruční seznam střelců (jen pro turnaje bez rozepsaných gólů) | organizátor |

Co kdo smí, hlídá databáze sama (Row Level Security). Kapitán vidí jen svůj tým,
výsledky zapisuje jen organizátor (admin) a veřejnost vidí jen schválené týmy a výsledky.

## 1. Databáze (čtyři migrace + výchozí data)

SQL Editor → New query → vlož obsah souboru → Run. **Každý soubor jen jednou, v tomto pořadí:**

1. `migrations/20261005120000_init.sql` — tabulky a oprávnění
2. `migrations/20261008120000_admin.sql` — administrace pro organizátora
3. `migrations/20261009120000_odhlaseni_tymu.sql` — kapitán může tým z turnaje odhlásit
4. `migrations/20261010120000_vysledky_bez_rozhodciho.sql` — zápis výsledků adminem (góly,
   karty, postup), zrušení role rozhodčí. Na konci vypíše, kdo byl z rozhodčího převeden na admina.
5. `migrations/20261011120000_role_jen_v_supabase.sql` — role už nejde měnit z webu, jen v Supabase
6. `migrations/20261012120000_mesto_tymu_nepovinne.sql` — město týmu nepovinné (archivní týmy bez kapitána)
7. `seed.sql` — turnaj **Winter Clutch 2027** s otevřenou registrací
8. `prvni-turnaj-2026.sql` — skutečný první turnaj (23. 8. 2026): týmy a umístění, bez zápasů

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

- **Přihlášky:** schválit, vrátit ke schválení nebo odmítnout; vidíš kontakt na kapitána.
  Schválený tým se objeví ve veřejných výsledcích turnaje.
- **Turnaje:** založit, upravit termín a popis, otevřít/zavřít přihlášky (otevřené
  smí být vždy jen na jednom turnaji), nastavit minimální soupisku, smazat.
- **U každého turnaje:** skupiny, konečné pořadí a postup týmů, rozpis zápasů (čas v pražském
  čase, Clutch Time), ruční seznam střelců, ocenění hráče turnaje a brankáře.
  Zápasy fáze „Skupina…“ se samy počítají do tabulky.
- **Zapsat výsledky:** vybereš zápas a zapíšeš skóre, góly (jméno, příjmení, minuta) a žluté
  či červené karty. Body se počítají samy (výhra 3, remíza 1, prohra 0). Když góly rozepíšeš,
  musí sedět se skóre. Střelci a karty na webu se pak spočítají ze zápasů. Tamtéž nastavíš
  umístění a „Postoupil ze skupiny“.
- **Po turnaji:** u turnaje nastav stav **Odehraný** a objeví se v archivu na `/turnaje`.
- **Uživatelé:** přehled všech účtů s kontakty a rolí (jen pro čtení; role se mění v Supabase).

Úvodní stránka, přehled turnajů i detaily výsledků se obnovují samy (nejpozději do
5 minut, změna v administraci i zapsaný výsledek hned).
