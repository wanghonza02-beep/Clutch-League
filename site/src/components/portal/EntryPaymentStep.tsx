import { PAYMENT_ACCOUNT } from "@/content/payment";
import { fmt, formatMoney } from "@/i18n/format";
import Link from "@/i18n/Link";
import { rich } from "@/i18n/rich";
import { getI18n } from "@/i18n/server";
import type { OpenTournament } from "@/lib/portal/types";
import { formatIban } from "@/lib/spayd";
import { ConfirmCheck, PaymentQr, TeamNameValue } from "./EntryForm";

/**
 * Poslední krok přihlášky týmu před odesláním organizátorovi: platba
 * startovného (částka turnaje, účet, QR platba) a podmínky účasti s povinnými
 * potvrzeními. Patří do formuláře přihlášky (TeamRegistrationForm,
 * EnterTournamentForm) — ten ho obalí EntryFormProvider a přidá tlačítko
 * „Odeslat formulář“. Turnaj bez startovného ukáže jen podmínky.
 */
export default async function EntryPaymentStep({ tournament }: { tournament: OpenTournament }) {
  const { locale, t: dict } = await getI18n();
  const t = dict.entryPayment;
  const fee = tournament.entryFee;
  const amount = formatMoney(locale, fee, dict.common.money);

  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
      {/* Částka, kterou tým viděl — akce ji porovná se startovným turnaje. */}
      <input type="hidden" name="entryFee" value={fee} />

      {fee > 0 && (
        <section aria-labelledby="platba-startovneho" className="cl-card cl-card--gold">
          <div className="cl-card__in">
            <div className="cl-card__body pay">
              <h2 id="platba-startovneho" className="pay__title">
                {t.title}
              </h2>
              <p className="pay__amount">{fmt(t.amount, { amount })}</p>

              <div className="pay__grid">
                <PaymentQr
                  iban={PAYMENT_ACCOUNT.iban}
                  amount={fee}
                  alt={fmt(t.qrAlt, { amount, account: PAYMENT_ACCOUNT.number })}
                  saveLabel={t.qrSave}
                  fileName="qr-platba-clutch-league.png"
                />
                <dl className="pay__facts">
                  <div>
                    <dt className="cl-stat__label">{t.account}</dt>
                    <dd className="pay__value cl-num">{PAYMENT_ACCOUNT.number}</dd>
                  </div>
                  <div>
                    <dt className="cl-stat__label">{t.iban}</dt>
                    <dd className="pay__value cl-num">{formatIban(PAYMENT_ACCOUNT.iban)}</dd>
                  </div>
                  <div>
                    <dt className="cl-stat__label">{t.amountLabel}</dt>
                    <dd className="pay__value">{amount}</dd>
                  </div>
                  <div>
                    <dt className="cl-stat__label">{t.message}</dt>
                    <dd className="pay__value">
                      <TeamNameValue />
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="pay__text">
                {rich(t.text, {
                  note: <strong>{t.textNote}</strong>,
                  confirmed: <strong>{t.textConfirmed}</strong>,
                })}
              </p>

              <ConfirmCheck name="confirmPayment">{t.confirmPayment}</ConfirmCheck>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="podminky-ucasti" className="cl-card">
        <div className="cl-card__in">
          <div className="cl-card__body pay">
            <h2 id="podminky-ucasti" className="pay__title">
              {fmt(t.termsTitle, { tournament: tournament.name })}
            </h2>
            <ol className="terms">
              {t.terms.map((term, i) => (
                <li key={i}>{fmt(term, { amount })}</li>
              ))}
            </ol>
            <div className="flex flex-col gap-[var(--sp-4)]">
              <ConfirmCheck name="confirmTerms">
                {rich(t.confirmTerms, {
                  rules: (
                    <Link href="/pravidla" target="_blank" rel="noopener">
                      {t.confirmTermsRules}
                    </Link>
                  ),
                })}
              </ConfirmCheck>
              <ConfirmCheck name="confirmTeam">{t.confirmTeam}</ConfirmCheck>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
