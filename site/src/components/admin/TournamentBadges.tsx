import { getDictionary } from "@/i18n/server";
import { phaseBadgeClass, type TournamentPhase } from "@/lib/tournamentModel";

/**
 * Štítky turnaje v administraci: stav (připravuje se / otevřené přihlášky /
 * probíhá / odehráno) a „Skryto z webu“, když turnaj veřejnost nevidí.
 * Stejné na kartě turnaje i v hlavičce jeho stránky v každé sekci.
 * `phase={false}`: bez štítku stavu — v přehledu nadcházejícího turnaje
 * ukazuje stav přihlášek jejich přepínač, ať tam není dvakrát.
 */
export default async function TournamentBadges({
  tournament,
  phase = true,
}: {
  tournament: { phase: TournamentPhase; published: boolean };
  phase?: boolean;
}) {
  const t = await getDictionary();
  return (
    <>
      {phase && (
        <span className={phaseBadgeClass(tournament.phase)}>{t.labels.tournamentPhase[tournament.phase]}</span>
      )}
      {!tournament.published && <span className="cl-badge cl-badge--neutral">{t.admin.hiddenBadge}</span>}
    </>
  );
}
