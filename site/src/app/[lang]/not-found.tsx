import Notice from "@/components/ui/Notice";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import Link from "@/i18n/Link";
import { lang } from "next/root-params";

/** 404 v jazyce stránky — neexistující adresa, turnaj, tým… */
export default async function NotFound() {
  const value = await lang();
  const t = getDictionaryFor(isLocale(value) ? value : DEFAULT_LOCALE);

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-6)]">
        <div className="cl-sectionhead">
          <span className="cl-sectionhead__over">{t.notFound.over}</span>
          <h1
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
          >
            {t.notFound.title}
          </h1>
        </div>
        <Notice tone="info">{t.notFound.text}</Notice>
        <div>
          <Link href="/" className="cl-btn cl-btn--primary">
            <span>{t.common.toHome}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
