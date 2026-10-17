import Image from "next/image";
import Countdown from "@/components/Countdown";
import HeroSchedule, { type ScheduleGroup } from "@/components/HeroSchedule";
import SectionLink from "@/components/SectionLink";
import TeamRegisterButton from "@/components/TeamRegisterButton";
import type { Locale } from "@/i18n/config";
import { formatLabel, stageLabel } from "@/i18n/data";
import type { Dictionary } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { formatDate, formatDateTime, formatTime, pragueIsoDay } from "@/lib/format";
import { loadLandingTournaments, type FeaturedTournament } from "@/lib/upcoming";

// Pozadí kampaně. Nové pozadí = nahradit tenhle soubor (stejný název).
const BACKGROUND = "/images/turnaj-pozadi.jpg";

/** Rozpis po fázích v pořadí výkopů; zápas mimo den turnaje má i datum. */
function scheduleGroups(upcoming: FeaturedTournament, locale: Locale, dict: Dictionary): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();
  for (const m of upcoming.schedule) {
    const stage = stageLabel(m.stage, dict);
    const group = groups.get(stage) ?? { stage, matches: [] };
    group.matches.push({
      id: m.id,
      time: pragueIsoDay(m.kickoff) === upcoming.dateIso ? formatTime(m.kickoff) : formatDateTime(m.kickoff, locale),
      home: m.home,
      away: m.away,
      score: m.homeGoals !== null && m.awayGoals !== null ? `${m.homeGoals} : ${m.awayGoals}` : null,
    });
    groups.set(stage, group);
  }
  return [...groups.values()];
}

/**
 * Kampaň nahoře na úvodní stránce. Ukazuje nejbližší turnaj z administrace
 * (Rozpis turnajů, jen zobrazené na webu; probíhající má přednost): název,
 * datum a čas, místo, formát, popis v jazyce stránky a odpočet do začátku.
 * Odpočet běží k zadanému času začátku, bez něj k prvnímu výkopu v den turnaje,
 * jinak k začátku dne. Probíhající turnaj místo odpočtu píše, že se hraje.
 * „Přihlásit tým“ je vidět, jen když má některý turnaj otevřené přihlášky;
 * u turnaje se zavřenými přihláškami to kampaň napíše.
 * Pod tlačítky je rozbalovací rozpis zápasů (taky z administrace).
 */
export default async function Hero() {
  const [{ locale, t: dict }, { featured: upcoming, others }] = await Promise.all([getI18n(), loadLandingTournaments()]);
  // Přihlásit tým jde jen na turnaj s otevřenými přihláškami (otevřený je nejvýš jeden).
  const registrationOpen = [upcoming, ...others].some((tournament) => tournament?.registrationOpen);
  const t = dict.hero;
  const time = upcoming ? (upcoming.startTime ?? (upcoming.firstKickoff && formatTime(upcoming.firstKickoff))) : null;
  const details = upcoming ? [upcoming.venue, formatLabel(upcoming.format, locale)].filter(Boolean).join(" · ") : "";
  const summary = upcoming?.summary[locale] ?? "";

  return (
    <section id="turnaj" aria-labelledby="turnaj-title" className="hero-stage relative isolate flex flex-col overflow-hidden">
      <Image src={BACKGROUND} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
      <div className="hero-stage__shade" aria-hidden />

      <div className="hero-stage__content">
        <span className="hero-stage__logo">
          <Image src="/brand-logo.jpg" alt="Clutch League" width={720} height={720} sizes="168px" priority />
        </span>

        {upcoming ? (
          <>
            <span className="cl-sectionhead__over hero-stage__over">
              {upcoming.phase === "in_progress" ? t.liveOver : t.over}
            </span>
            <h1 id="turnaj-title" className="hero-stage__title">
              {upcoming.name}
            </h1>
            <p className="hero-stage__date">
              {formatDate(upcoming.dateIso, locale)}
              {time && ` · ${time}`}
            </p>
            {details && <p className="hero-stage__meta">{details}</p>}
            {summary && <p className="hero-stage__note hero-stage__summary">{summary}</p>}
            {upcoming.phase === "preparing" && <p className="hero-stage__meta">{t.registrationClosed}</p>}
            {upcoming.phase === "in_progress" ? (
              <p className="hero-countdown__today">{t.live}</p>
            ) : (
              <Countdown
                startsAt={upcoming.startsAt}
                endsAt={upcoming.endsAt}
                labels={{
                  label: t.countdownLabel,
                  days: t.days,
                  hours: t.hours,
                  minutes: t.minutes,
                  seconds: t.seconds,
                  today: t.today,
                }}
              />
            )}
          </>
        ) : (
          <>
            <h1 id="turnaj-title" className="hero-stage__title">
              {t.noneTitle}
            </h1>
            <p className="hero-stage__note">{t.noneText}</p>
          </>
        )}

        <div className={`hero-stage__actions${registrationOpen ? "" : " hero-stage__actions--single"}`}>
          {registrationOpen && (
            <span className="cl-glow-wrap w-full">
              <TeamRegisterButton className="cl-btn cl-btn--primary cl-btn--lg w-full" />
            </span>
          )}
          <SectionLink section="jak-to-funguje" className="cl-btn cl-btn--secondary cl-btn--lg w-full">
            <span>{t.moreInfo}</span>
          </SectionLink>
        </div>

        {upcoming && (
          <HeroSchedule
            groups={scheduleGroups(upcoming, locale, dict)}
            labels={{ button: t.schedule, empty: t.scheduleEmpty }}
          />
        )}
      </div>
    </section>
  );
}
