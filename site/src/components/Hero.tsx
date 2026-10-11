import Image from "next/image";
import Countdown from "@/components/Countdown";
import HeroSchedule, { type ScheduleGroup } from "@/components/HeroSchedule";
import SectionLink from "@/components/SectionLink";
import TeamRegisterButton from "@/components/TeamRegisterButton";
import type { Locale } from "@/i18n/config";
import { stageLabel } from "@/i18n/data";
import type { Dictionary } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { formatDate, formatDateTime, formatTime, pragueIsoDay } from "@/lib/format";
import { loadUpcoming, type UpcomingCard } from "@/lib/upcoming";

// Pozadí kampaně. Nové pozadí = nahradit tenhle soubor (stejný název).
const BACKGROUND = "/images/turnaj-pozadi.jpg";

/** Rozpis po fázích v pořadí výkopů; zápas mimo den turnaje má i datum. */
function scheduleGroups(upcoming: UpcomingCard, locale: Locale, dict: Dictionary): ScheduleGroup[] {
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
 * Kampaň nahoře na úvodní stránce. Ukazuje vždy nejbližší nadcházející turnaj
 * z administrace (Turnaje → Nový turnaj): název, datum a odpočet do začátku.
 * Odpočet běží k prvnímu výkopu v den turnaje, bez něj k začátku dne turnaje.
 * Pod tlačítky je rozbalovací rozpis zápasů (taky z administrace).
 */
export default async function Hero() {
  const [{ locale, t: dict }, upcoming] = await Promise.all([getI18n(), loadUpcoming()]);
  const t = dict.hero;

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
            <span className="cl-sectionhead__over hero-stage__over">{t.over}</span>
            <h1 id="turnaj-title" className="hero-stage__title">
              {upcoming.name}
            </h1>
            <p className="hero-stage__date">
              {formatDate(upcoming.dateIso, locale)}
              {upcoming.firstKickoff && ` · ${formatTime(upcoming.firstKickoff)}`}
            </p>
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
          </>
        ) : (
          <>
            <h1 id="turnaj-title" className="hero-stage__title">
              {t.noneTitle}
            </h1>
            <p className="hero-stage__note">{t.noneText}</p>
          </>
        )}

        <div className="hero-stage__actions">
          <span className="cl-glow-wrap w-full">
            <TeamRegisterButton className="cl-btn cl-btn--primary cl-btn--lg w-full" />
          </span>
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
