# Před spuštěním webu: co zbývá udělat

Tenhle soubor je kontrolní seznam. Až se rozhodneš web pustit na internet, projdeme
ho spolu odshora dolů. Odškrtávej `[x]`, co je hotové.

_Naposledy aktualizováno: 10. 10. 2026 (web ve 4 jazycích, Winter Clutch 5+1 se soupiskou 6–10, e-mail a TikTok v kontaktech)_

---

## Dočasná nastavení pro testování (po testování vrátit zpět!)

- [ ] **Potvrzování e-mailu je vypnuté** (Supabase → Authentication → Sign In / Providers → Email → **Confirm email**).
  Při spuštění musí být **ZAPNUTÉ**. Jinak se může kdokoli zaregistrovat s cizím e-mailem.
  Zapnout až v **kroku 6**, ne dřív (bez fungujících e-mailů by se nikdo nezaregistroval).

---

## A. Povinné. Postup nasazení, krok za krokem

Kroky jdou v pořadí, ve kterém se dělají. Každý stojí na tom předchozím
(e-maily nejdou bez domény, doména nejde bez nahraného webu).

### Krok 1. Doména
- [ ] Koupit doménu (např. `clutchleague.cz`, na Wedos.cz asi 150–300 Kč/rok).
  Hosting ani e-mailovou schránku k ní kupovat netřeba. Web poběží na Vercelu,
  e-maily bude posílat Resend.

### Krok 2. Nahrát web na Vercel (hotovo 9. 10. 2026)
Web běží na **https://clutch-league.vercel.app**. Kód je na GitHubu
(`github.com/wanghonza02-beep/Clutch-League`, veřejný repozitář) a Vercel po každé změně
na GitHubu nasadí novou verzi sám.
- [x] Projekt `clutch-league` ve Vercelu (tým „honzis“) napojený na GitHub, větev `main`.
- [x] **Root Directory:** `site`, **Framework:** Next.js. Bez toho Vercel nahrál hlavní složku
  a web hlásil „page doesn't exist“.
- [x] **Environment Variables** (Production, Preview, Development):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  `NEXT_PUBLIC_SITE_URL` přijde v kroku 3, až bude doména napojená.
- [x] **Region serveru:** Dublin (`dub1`), stejně jako databáze Supabase (Irsko, AWS eu-west-1).
- [x] **Nikdy** nevkládat klíč `service_role` / secret. Web ho nepotřebuje. (Ve Vercelu není.)
- [x] Ověřeno: všechny veřejné stránky, archiv turnajů z databáze, přihlášení, registrace, PDF, obrázky.
- [ ] Odkazy v e-mailech (zapomenuté heslo, potvrzení účtu) na `.vercel.app` zatím nefungují.
  Vyřeší je kroky 3–5.

### Krok 3. Napojit doménu na web
- [ ] **Ve Vercelu:** projekt `clutch-league` → **Settings → Domains → Add Domain** →
  napsat `tvoje-domena.cz`. Vercel nabídne přidat i `www.tvoje-domena.cz` s přesměrováním,
  to potvrď. Vercel teď ukáže „Invalid Configuration“ a vypíše **dva DNS záznamy**, které
  chce vidět (typ, název, hodnotu). Nech si tu stránku otevřenou.
- [ ] **Ve Wedosu:** Zákaznická administrace → Domény → tvoje doména → **DNS záznamy**:
  - **Smaž** staré záznamy typu `A` a `AAAA`, které mají prázdný název nebo název `www`
    (vedou na parkovací stránku Wedosu a překážely by).
  - **Přidej** záznam typu `A`: název nech **prázdný**, hodnota = IP adresa z Vercelu.
  - **Přidej** záznam typu `CNAME`: název `www`, hodnota = adresa z Vercelu
    (končí na `vercel-dns…com`).
  - Hodnoty **kopíruj přesně z Vercelu**, ne odsud. Vercel je čas od času mění.
- [ ] Počkat. Wedos změny zveřejňuje po pár minutách, celkem to trvá od 10 minut do pár hodin.
  Až Vercel u domény ukáže **Valid Configuration**, je hotovo. Zabezpečení (https, zámek
  v prohlížeči) Vercel zařídí sám.
- [ ] Ve Vercelu: **Settings → Environment Variables** → `NEXT_PUBLIC_SITE_URL` přepsat
  z `https://clutch-league.vercel.app` na `https://tvoje-domena.cz`. Pak **Deployments** →
  u posledního nasazení tři tečky → **Redeploy** (proměnná se do webu vloží až při novém nasazení).
  Nebo mi napiš a udělám to já.

### Krok 4. Supabase: adresy webu
Zatím (9. 10. 2026) nastavené na `https://clutch-league.vercel.app`, ať odkazy v e-mailech
fungují už teď. Ve Vercelu je `NEXT_PUBLIC_SITE_URL` = `https://clutch-league.vercel.app`.
- [x] Mezikrok (9. 10. 2026): **Site URL** = `https://clutch-league.vercel.app`, **Redirect URLs** obsahují
  `https://clutch-league.vercel.app/**` a `http://localhost:3000/**`.
- [ ] S doménou: Authentication → URL Configuration → **Site URL** přepsat na `https://tvoje-domena.cz`.
- [ ] S doménou: **Redirect URLs**: přidat `https://tvoje-domena.cz/**` (vercel.app a localhost můžou zůstat).

### Krok 5. E-maily (kapitáni musí dostat potvrzení účtu a nové heslo)
Dokud tohle není hotové, e-mail dostane jen člověk z týmu tvého Supabase projektu
a jen pár zpráv za hodinu.
- [ ] Založit účet na **resend.com** (zdarma do 3 000 e-mailů měsíčně).
- [ ] V Resendu **Domains → Add Domain** → `tvoje-domena.cz`, region **EU (Ireland)**.
  Resend vypíše 3–4 DNS záznamy (`MX` a `TXT` pro `send`, `TXT` pro `resend._domainkey`).
- [ ] Ve Wedosu je přidat do **DNS záznamů** stejně jako v kroku 3. Do názvu piš jen první
  část (`send`, `resend._domainkey`), Wedos si doménu doplní sám. Stávající záznamy
  pro web nemaž, tyhle se jich nedotknou.
- [ ] V Resendu kliknout na **Verify**. Pokud nejde hned, za 10–30 minut znovu.
- [ ] V Resendu vytvořit **API Key** (Sending access). Je tajný, nikam ho neposílat, patří jen do Supabase.
- [ ] Supabase → Authentication → Emails → **SMTP Settings** → Enable custom SMTP:
  host `smtp.resend.com`, port `465`, username `resend`, heslo = API key,
  odesílatel `noreply@tvoje-domena.cz`, jméno `Clutch League`.
- [ ] Vložit **e-mailové šablony** (Supabase je do té doby zamčené). Jsou čtyřjazyčné: e-mail přijde
  v jazyce, ve kterém se kapitán na webu registroval (čeština, angličtina, ukrajinština, slovenština).
  - Confirm sign up: předmět `Clutch League – potvrzení účtu / Confirm your account`, obsah ze `supabase/templates/potvrzeni-uctu.html`
  - Reset password: předmět `Clutch League – nové heslo / New password`, obsah ze `supabase/templates/nove-heslo.html`
  - Hned potom poslat zkušební e-mail (registrace v angličtině na webu) a ověřit, že přišel anglicky.
- [ ] Authentication → **Rate Limits**: zvýšit limit e-mailů za hodinu (např. na 100).
- [ ] **E-maily kapitánům o přihlášce** (schváleno / zamítnuto / vráceno / smazáno). Ve Vercelu
  → Settings → Environment Variables (jen **Production**) přidat `RESEND_API_KEY` (stejný druh klíče
  z Resendu, klidně druhý) a `MAIL_FROM` = `Clutch League <noreply@tvoje-domena.cz>`, pak Redeploy.
  Bez nich web funguje dál, kapitán se o rozhodnutí dozví jen v portálu.

### Krok 6. Zapnout potvrzování e-mailu
- [ ] Supabase → Authentication → Sign In / Providers → Email → **Confirm email** zapnout.
  Až teď, když e-maily z kroku 5 opravdu chodí. Pak odškrtni i položku nahoře
  v „Dočasná nastavení“.

### Krok 7. Databáze a data
- [ ] Všechny soubory spuštěné v pořadí: `20261005120000_init.sql`, `20261008120000_admin.sql`,
  `20261009120000_odhlaseni_tymu.sql`, `20261010120000_vysledky_bez_rozhodciho.sql`,
  `20261011120000_role_jen_v_supabase.sql`, `20261012120000_mesto_tymu_nepovinne.sql`,
  `20261013120000_winter_5plus1_soupiska.sql`, `20261014120000_prihlasky_oznameni.sql`, `seed.sql`
  (ověř: v Table Editoru existuje tabulka `match_events`).
  Pozor (11. 10. 2026): v ostré databázi chyběla migrace č. 3 (odhlášení týmu) — kapitáni se nemohli
  sami odhlásit. Migrace č. 8 ji obsahuje celou, takže stačí spustit č. 8 (č. 3 zvlášť není potřeba).
- [x] **Ukázková data smazána** (9. 10. 2026, `supabase/smazat-ukazkova-data.sql`). Zůstal turnaj Winter Clutch 2027
  a 2 schválené týmy s kapitánem (ověřit, jestli nejsou zkušební).
  Archiv turnajů obsahuje vymyšlené týmy, výsledky a střelce. `seed.sql` už je bez nich (9. 10. 2026),
  takže se při novém spuštění nevrátí.
- [x] **Skutečný první turnaj** (9. 10. 2026, `supabase/prvni-turnaj-2026.sql`): Clutch League Cup, 23. 8. 2026,
  8 týmů s pořadím podle dokumentu „TÝMY KTERÉ HRÁLI 1. TURNAJ + UMÍSTĚNÍ“ (Google Disk). Zápasy,
  góly ani střelci nejsou, web je u turnaje neukazuje. Týmy 5.–8. jsou v pořadí s pomlčkou.
- [ ] Winter Clutch 2027 (10. 1. 2027) má otevřené přihlášky. Zápasy a výsledky se zapisují v Portálu.

### Krok 8. Účty a zkouška na ostré doméně
- [ ] Tvůj účet má v Table Editoru (`profiles`) roli `admin` a v navigaci vidíš **Administraci**.
- [ ] Na **ostré doméně** vyzkoušet: registrace → e-mail přijde česky → odkaz funguje i na mobilu →
  přihlášení → zapomenuté heslo → nové heslo.
- [ ] Vyzkoušen zápis výsledku (Portál → Zapsat výsledky): skóre, góly, karta, postup ze skupiny →
  výsledek je vidět v Odehraných zápasech.
- [ ] Vyzkoušen celý postup kapitána: registrace → přihláška týmu → soupiska → schválení v administraci.
- [ ] Projít celý web na mobilu i na počítači.

### Další změny webu po spuštění
Když web později upravíme, stačí mi napsat „nahraj to online“. Změny pošlu na GitHub
a Vercel je za 1–2 minuty sám nasadí na doménu. Data v databázi (týmy, výsledky)
se tím nemění. Ta se zadávají v Portálu a jsou vidět hned.

---

## B. Důležité. Doporučuju vyřešit před spuštěním

- [x] **Záloha kódu webu.** Celá složka je na GitHubu (`wanghonza02-beep/Clutch-League`, 9. 10. 2026).
- [ ] **Veřejný GitHub obsahuje všechny původní fotky z turnaje** (složka „Fotky z prvního turnaje…“),
  tedy i obličeje a jména hráčů jiných týmů. To odporuje pravidlu pro fotky níže. Nejjednodušší řešení:
  přepnout repozitář na **soukromý** (GitHub → repozitář → Settings → dole „Change visibility“).
  Na web to nemá vliv, Vercel k soukromému repozitáři přístup má.
- [x] **Pravidlo pro fotky na webu** (9. 10. 2026): hráči **Žlutého baletu** (černožluté pruhované dresy,
  brankář v oranžovém) smějí být vidět celí, s obličejem, jménem i číslem. Hráči ostatních týmů jen
  s číslem, **bez obličeje a bez příjmení** na dresu. Galerie je podle toho prověřená, 3 fotky vyměněné
  (soupeř se jménem PECHA, brankář jiného týmu, hráči se jmény CZINA P. a POLHEIS).
- [ ] **Bezplatný Vercel (Hobby) je jen pro nekomerční použití.** Pokud liga vybírá startovné,
  má sponzory nebo reklamu, podmínky Vercelu chtějí placený tarif Pro (asi 20 $ měsíčně).
- [ ] **Texty k osobním údajům (GDPR).** Web sbírá jméno, e-mail a telefon. Registrace má souhlas se
  zpracováním, ale chybí stránka **Zásady ochrany osobních údajů** a odkaz na ni. Konkrétní znění
  je na tobě (nebo právníkovi), já jen připravím místo a odkaz.
- [ ] **PDF s pravidly kampaně Winter Clutch League.** Zástupný soubor je smazaný, web píše
  „Pravidla Winter Clutch League zveřejníme před turnajem“. Až bude skutečné PDF, pošli mi ho
  (nahraju do `public/docs/` a doplním v `src/content/campaign.ts`).
- [ ] **Obecná pravidla** jsou PDF pojmenované „Pravidla Clutch League Cup 2026“. Pokud má být obecné
  bez vazby na Cup, přejmenovat / vyměnit soubor (`src/components/RulesSection.tsx`).
- [ ] **Rozpis Winter Clutch League** (`/winter-clutch`): ukázkové týmy a časy jsou pryč, stránka píše
  „Rozpis zápasů a soupisky týmů zveřejníme po uzávěrce přihlášek“. Skutečný rozpis a soupisky
  doplním do `src/content/winter-clutch-preview.ts`, až mi je pošleš. Odkaz „Rozpis zápasů a týmy“
  se pak v Pravidlech a v archivu objeví sám. Jména hráčů = osobní údaje: jen se souhlasem hráčů.
- [ ] **Winter Clutch je 5+1** (5 hráčů v poli + brankář), soupiska **aspoň 6, nejvýš 10 hráčů**. Web je
  hotový (10. 10. 2026); v databázi to nastaví migrace `20261013120000_winter_5plus1_soupiska.sql`
  (Supabase → SQL Editor → vlož → Run). Poslední řádek výsledku ukáže formát 5+1 a soupisku 6–10.
  Bez ní administrace turnaj neuloží a přihláška počítá se starou nejmenší soupiskou 3.
- [ ] **Recenze hráčů:** vymyšlené recenze jsou pryč a sekce „Proč zrovna Clutch League“ i odkaz
  „Proč my“ v navigaci jsou schované. Až budou skutečné, schválené citace, doplním je do
  `src/content/reviews.ts` a sekce se ukáže sama.
- [ ] **Obrázek úvodní stránky má datum nakreslené přímo v grafice** (10. 1. 2027). Když se termín
  změní, text na webu se přepíše sám z administrace, ale obrázek je nutné vyměnit.
- [ ] **Ochrana proti falešným registracím:** Supabase → Authentication → Attack Protection → zapnout CAPTCHA.
- [ ] **Bezplatný Supabase se po týdnu bez návštěv pozastaví** a nemá zálohy. Před ostrým provozem
  zvážit placený tarif, nebo si aspoň pravidelně stáhnout export dat.
- [ ] Kontakty v patičce a na stránce Kontakt zkontrolovat: Instagram @clutchleague_football,
  e-mail clutch.league@seznam.cz, TikTok @clutchleague_football.
- [ ] **Jazyky:** web je česky, anglicky, ukrajinsky a slovensky (přepínač v liště). Překlady prošel
  jen Claude — ideálně je nechat přečíst rodilým mluvčím (hlavně ukrajinštinu).
- [ ] **Co zůstává jen česky:** PDF s pravidly (v ostatních jazycích to u PDF stojí) a popis turnaje,
  který píšeš v administraci (v ostatních jazycích se nezobrazí). Fáze zápasů piš česky
  (Skupina A, Semifinále, Finále) — web je sám přeloží.

---

## C. Nepovinné. Z referenčního webu zatím nestavěno

- [ ] Náhledový obrázek a popis při sdílení odkazu (Instagram, WhatsApp, Messenger) a mapa webu pro Google.
- [ ] Logo týmu (nahrání obrázku), vyžaduje Supabase Storage.
- [ ] Novinky / články.
- [ ] QR akreditace hráčů a export soupisky do PDF.
- [ ] Fanouškovská zóna, hodnocení rozhodčích, rozhodnutí ligy.
- [ ] Obnova: úprava e-mailu účtu (dnes jen přes organizátora).

---

## Hotovo (pro přehled)

- Úvodní stránka, historie, galerie, kontakt, pravidla ke stažení
- Odehrané turnaje a detail turnaje (pořadí, tabulky, střelci, výsledky)
- Účty kapitánů v databázi (Supabase): registrace, přihlášení, zapomenuté heslo
- Přihláška týmu jen po přihlášení kapitána, soupiska hráčů
- Organizátor zapisuje výsledky: skóre, góly s minutou, karty, postup ze skupiny (role rozhodčí zrušena)
- Administrace pro organizátora (přihlášky, turnaje, zápasy, výsledky, střelci, přehled uživatelů)
- Role (admin / kapitán) se mění jen v Supabase (Table Editor → profiles), ne z webu
- Náhled Winter Clutch League: rozpis zápasů a soupisky týmů (zatím ukázková data)
- Úprava účtu (jméno, telefon), změna hesla
- Termín nadcházejícího turnaje na úvodní stránce se bere z databáze
- Produkční build ověřený (9. 10. 2026), web je připravený k nahrání na Vercel
- Web ve 4 jazycích (10. 10. 2026): čeština (výchozí, adresy bez předpony), angličtina `/en`,
  ukrajinština `/uk`, slovenština `/sk`. Přepínač v liště si volbu pamatuje.
- Kontakty: Instagram, e-mail clutch.league@seznam.cz a TikTok na stránce Kontakt i v patičce

## Kde co najdeš
- Návod na nastavení Supabase: `supabase/README.md`
- E-mailové šablony: `supabase/templates/`
- Databázové skripty: `supabase/migrations/`, `supabase/seed.sql`, `supabase/smazat-ukazkova-data.sql`
- Šablona nastavení webu: `.env.example`
