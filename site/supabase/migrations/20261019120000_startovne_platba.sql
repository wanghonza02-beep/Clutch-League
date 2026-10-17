-- =============================================================================
-- Clutch League — startovné, platba a podmínky účasti (migrace č. 11)
--
-- Spuštění: Supabase Dashboard → SQL Editor → New query → vlož celý soubor → Run.
-- Spouští se po migracích č. 1–10. Druhé spuštění nic nepokazí.
--
-- Co dělá:
--   1. Turnaj má startovné (entry_fee, celé Kč za tým). Winter Clutch 2027 má
--      2 700 Kč.
--   2. Přihláška si pamatuje, co kapitán při odeslání potvrdil (confirmations:
--      payment = startovné uhradí na účet, terms = souhlasí s podmínkami účasti
--      a pravidly, team = seznámil s nimi celý tým), kdy (confirmed_at) a jaké
--      startovné viděl (confirmed_fee). Bez potvrzení databáze přihlášku od
--      kapitána nepřijme. Čas a částku doplní databáze sama, ne prohlížeč.
--   3. Startovné přijato: organizátor u přihlášky označí platbu (paid_at; kdo
--      ji označil, doplní databáze do paid_by).
--        * Schválit přihlášku na turnaj se startovným jde až po zaplacení.
--        * Schválené přihlášce zaplacení zrušit nejde — nejdřív ji vrátit ke schválení.
--        * Zaplacenou přihlášku kapitán sám neodhlásí (registrace je po zaplacení
--          závazná, odhlášení řeší s pořadatelem).
--      Přihlášky schválené před touhle migrací zůstávají schválené.
--   4. Pojistka: oprava politiky „Kapitán vidí turnaje svého týmu“ ze 17. 10.
--      (kdyby se opravné SQL nespustilo, přihlašování týmů by nefungovalo).
--
-- Poslední řádek výsledku ukáže startovné a přihlášky u každého turnaje.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Startovné turnaje
-- ---------------------------------------------------------------------------

alter table public.tournaments add column if not exists entry_fee integer not null default 0;

alter table public.tournaments drop constraint if exists tournaments_entry_fee_check;
alter table public.tournaments
  add constraint tournaments_entry_fee_check check (entry_fee between 0 and 100000);

comment on column public.tournaments.entry_fee is
  'Startovné v Kč za tým. Ukáže se kapitánovi před odesláním přihlášky (i v QR platbě). 0 = bez startovného.';

-- Jen když startovné ještě nikdo nenastavil — druhé spuštění nepřepíše změnu z administrace.
update public.tournaments set entry_fee = 2700 where slug = 'winter-clutch-2027' and entry_fee = 0;

-- ---------------------------------------------------------------------------
-- 2) Potvrzení u přihlášky
-- ---------------------------------------------------------------------------

alter table public.tournament_entries
  add column if not exists confirmations text[] not null default '{}',
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_fee integer,
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references public.profiles (id) on delete set null;

comment on column public.tournament_entries.confirmations is
  'Co kapitán při odeslání potvrdil: payment (startovné uhradí), terms (podmínky účasti a pravidla), team (seznámil tým).';
comment on column public.tournament_entries.confirmed_at is 'Kdy kapitán přihlášku s potvrzeními odeslal.';
comment on column public.tournament_entries.confirmed_fee is 'Startovné (Kč), které kapitán při odeslání viděl.';
comment on column public.tournament_entries.paid_at is 'Kdy organizátor označil startovné jako přijaté. Prázdné = nezaplaceno.';
comment on column public.tournament_entries.paid_by is 'Organizátor, který platbu označil.';

-- Kapitán posílá potvrzení s přihláškou; organizátor označuje platbu. Veřejnost
-- (anon) na nové sloupce právo nemá.
grant insert (confirmations) on public.tournament_entries to authenticated;
grant update (paid_at) on public.tournament_entries to authenticated;

-- Přihláška od kapitána musí mít všechna potvrzení. Čas a startovné doplní
-- databáze; platbu si kapitán sám označit nemůže. Vložení bez přihlášeného
-- uživatele webu (archiv, Table Editor) potvrzení nepotřebuje.
create or replace function private.entry_confirmations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee integer;
  v_required text[];
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  select entry_fee into v_fee from public.tournaments where id = new.tournament_id;
  v_fee := coalesce(v_fee, 0);
  v_required := case when v_fee > 0 then array['payment', 'terms', 'team'] else array['terms', 'team'] end;

  if not (coalesce(new.confirmations, '{}') @> v_required) then
    raise exception 'confirmations_missing'
      using errcode = 'P0001', hint = 'Přihláška musí mít potvrzené startovné a podmínky účasti.';
  end if;

  new.confirmations := v_required;
  new.confirmed_at := now();
  new.confirmed_fee := v_fee;
  new.paid_at := null;
  new.paid_by := null;
  return new;
end;
$$;

drop trigger if exists tournament_entries_confirmations on public.tournament_entries;
create trigger tournament_entries_confirmations
  before insert on public.tournament_entries
  for each row execute function private.entry_confirmations();

-- ---------------------------------------------------------------------------
-- 3) Platba a schválení
-- ---------------------------------------------------------------------------

create or replace function private.guard_entry_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee integer;
begin
  -- Kdo platbu označil (z Table Editoru zůstane prázdné).
  if new.paid_at is distinct from old.paid_at then
    new.paid_by := case when new.paid_at is null then null else (select auth.uid()) end;
  end if;

  if (select auth.uid()) is null or new.status::text <> 'approved' or new.paid_at is not null then
    return new;
  end if;

  if old.status::text <> 'approved' then
    select entry_fee into v_fee from public.tournaments where id = new.tournament_id;
    if coalesce(v_fee, 0) > 0 then
      raise exception 'entry_not_paid'
        using errcode = 'P0001', hint = 'Schválit jde až po připsání startovného.';
    end if;
  elsif old.paid_at is not null then
    raise exception 'entry_paid_approved'
      using errcode = 'P0001', hint = 'Schválené přihlášce nejde zrušit zaplacení. Nejdřív ji vrať ke schválení.';
  end if;

  return new;
end;
$$;

drop trigger if exists tournament_entries_guard_payment on public.tournament_entries;
create trigger tournament_entries_guard_payment
  before update of status, paid_at on public.tournament_entries
  for each row execute function private.guard_entry_payment();

-- Odhlášení týmu kapitánem (politika z migrací č. 3, 8 a 10) — navíc jen
-- u nezaplacené přihlášky.
drop policy if exists "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries;
create policy "Kapitán odhlašuje svůj tým z otevřeného turnaje" on public.tournament_entries
  for delete to authenticated
  using (
    (select private.current_user_role()) = 'captain'
    and status::text <> 'rejected'
    and paid_at is null
    and exists (
      select 1 from public.teams t
      where t.id = tournament_entries.team_id and t.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tournaments tr
      where tr.id = tournament_entries.tournament_id and tr.registration_open
    )
    and not (select private.team_has_matches(tournament_entries.tournament_id, tournament_entries.team_id))
  );

-- ---------------------------------------------------------------------------
-- Přihláška nového týmu (funkce z migrace č. 1) — teď i s potvrzeními.
-- Starší volání bez potvrzení databáze odmítne (confirmations_missing).
-- ---------------------------------------------------------------------------

drop function if exists public.register_team(text, text, smallint, text, text);

create or replace function public.register_team(
  p_name text,
  p_city text,
  p_founded_year smallint,
  p_colors text,
  p_note text,
  p_confirmations text[] default '{}'
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tournament uuid;
  v_team uuid;
begin
  select id into v_tournament
  from public.tournaments
  where registration_open
  limit 1;

  if v_tournament is null then
    raise exception 'registration_closed' using errcode = 'P0001';
  end if;

  insert into public.teams (name, city, founded_year, colors, note, owner_id)
  values (p_name, p_city, p_founded_year, coalesce(p_colors, ''), coalesce(p_note, ''), (select auth.uid()))
  returning id into v_team;

  insert into public.tournament_entries (tournament_id, team_id, confirmations)
  values (v_tournament, v_team, coalesce(p_confirmations, '{}'));

  return v_team;
end;
$$;

revoke execute on function public.register_team(text, text, smallint, text, text, text[]) from public, anon;
grant execute on function public.register_team(text, text, smallint, text, text, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Pojistka: politika turnajů bez zacyklení s politikami přihlášek
--    (stejné jako v migraci č. 10 a opravném SQL ze 17. 10.)
-- ---------------------------------------------------------------------------

create or replace function private.is_own_tournament(p_tournament uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tournament_entries e
    join public.teams t on t.id = e.team_id
    where e.tournament_id = p_tournament and t.owner_id = (select auth.uid())
  )
  or exists (
    select 1 from public.notifications n
    where n.tournament_id = p_tournament and n.user_id = (select auth.uid())
  );
$$;

grant execute on function private.is_own_tournament(uuid) to authenticated;

drop policy if exists "Kapitán vidí turnaje svého týmu" on public.tournaments;
create policy "Kapitán vidí turnaje svého týmu" on public.tournaments
  for select to authenticated
  using (private.is_own_tournament(id));

-- ---------------------------------------------------------------------------
-- Výsledek: startovné a přihlášky u turnajů
-- ---------------------------------------------------------------------------

select
  t.name as "Turnaj",
  t.entry_fee as "Startovné (Kč)",
  case when t.registration_open then 'otevřené' else 'zavřené' end as "Přihlášky",
  count(e.team_id) as "Přihlášek",
  count(e.paid_at) as "Zaplaceno"
from public.tournaments t
left join public.tournament_entries e on e.tournament_id = t.id
group by t.id
order by t.starts_on;
