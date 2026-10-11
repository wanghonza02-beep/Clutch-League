import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import BackButton from "@/components/BackButton";
import InstagramIcon from "@/components/InstagramIcon";
import TikTokIcon from "@/components/TikTokIcon";
import SplitText from "@/components/ui/SplitText";
import { CONTACT } from "@/content/contact";
import { getDictionary, pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: pageTitle(t, t.contact.title),
    description: t.contact.metaDescription,
  };
}

/** Jeden kontakt: ikona, popisek, adresa a tlačítko. */
function ContactCard({
  icon,
  label,
  value,
  href,
  button,
  buttonIcon,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  button: string;
  buttonIcon: ReactNode;
}) {
  const external = href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <div className="cl-card">
      <div className="cl-card__in">
        <div className="cl-card__body flex flex-col items-center gap-[var(--sp-6)] text-center sm:flex-row sm:text-left">
          <span className="flex-none" style={{ color: "var(--gold)" }}>
            {icon}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--sp-1)]">
            <span className="cl-field__label">{label}</span>
            <a
              href={href}
              {...external}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: "var(--fw-display)",
                fontSize: "var(--fs-h4)",
                lineHeight: "var(--lh-snug)",
                textDecoration: "none",
                overflowWrap: "anywhere",
              }}
            >
              {value}
            </a>
          </div>
          <a href={href} {...external} className="cl-btn cl-btn--primary w-full flex-none sm:w-auto">
            {buttonIcon}
            <span>{button}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function Kontakt() {
  const t = (await getDictionary()).contact;

  return (
    <main className="pt-[var(--sp-8)] pb-[var(--section-y)]">
      <div className="cl-container-narrow flex flex-col gap-[var(--sp-10)]">
        <div>
          <BackButton />
        </div>
        <div className="cl-sectionhead">
          <SplitText
            tag="h1"
            className="cl-display"
            style={{ fontSize: "var(--fs-h1)", fontStyle: "italic", lineHeight: "var(--lh-heading)" }}
            text={t.title}
            textAlign="left"
          />
          <p className="cl-sectionhead__sub">{t.sub}</p>
        </div>

        <div className="flex flex-col gap-[var(--sp-5)]">
          <ContactCard
            icon={<InstagramIcon size={40} />}
            label="Instagram"
            value={CONTACT.instagram.handle}
            href={CONTACT.instagram.href}
            button={t.instagramButton}
            buttonIcon={<InstagramIcon size={16} />}
          />
          <ContactCard
            icon={<Mail size={40} strokeWidth={2} aria-hidden />}
            label={t.emailLabel}
            value={CONTACT.email}
            href={`mailto:${CONTACT.email}`}
            button={t.emailButton}
            buttonIcon={<Mail size={16} strokeWidth={2} aria-hidden />}
          />
          <ContactCard
            icon={<TikTokIcon size={40} />}
            label="TikTok"
            value={CONTACT.tiktok.handle}
            href={CONTACT.tiktok.href}
            button={t.tiktokButton}
            buttonIcon={<TikTokIcon size={16} />}
          />
        </div>
      </div>
    </main>
  );
}
