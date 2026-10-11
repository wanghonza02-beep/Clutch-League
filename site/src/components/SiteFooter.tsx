import { Mail } from "lucide-react";
import InstagramIcon from "@/components/InstagramIcon";
import TikTokIcon from "@/components/TikTokIcon";
import { Footer } from "@/components/ui/footer";
import { CONTACT } from "@/content/contact";
import { getDictionary } from "@/i18n/server";

export default async function SiteFooter() {
  const t = await getDictionary();

  return (
    <Footer
      brandName="Clutch League"
      navLabel={t.footer.label}
      logo={
        <span className="cl-logo__type">
          <span className="cl-logo__word" style={{ fontSize: "20px" }}>
            Clutch
          </span>
          <span className="cl-logo__sub" style={{ fontSize: "10px" }}>
            League
          </span>
        </span>
      }
      socialLinks={[
        {
          icon: <InstagramIcon size={20} />,
          href: CONTACT.instagram.href,
          label: t.footer.instagram,
        },
        {
          icon: <TikTokIcon size={20} />,
          href: CONTACT.tiktok.href,
          label: t.footer.tiktok,
        },
        {
          icon: <Mail size={20} strokeWidth={2} aria-hidden />,
          href: `mailto:${CONTACT.email}`,
          label: t.footer.email,
        },
      ]}
      contactLinks={[{ href: `mailto:${CONTACT.email}`, label: CONTACT.email }]}
      mainLinks={[
        { href: "/kontakt", label: t.footer.contact },
        { href: "/prihlasit-tym", label: t.footer.registerTeam },
      ]}
      copyright={{
        text: t.footer.copyright,
        license: t.footer.rights,
      }}
    />
  );
}
