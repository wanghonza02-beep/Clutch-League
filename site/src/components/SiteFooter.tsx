import InstagramIcon from "@/components/InstagramIcon";
import { Footer } from "@/components/ui/footer";

export default function SiteFooter() {
  return (
    <Footer
      brandName="Clutch League"
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
          href: "https://www.instagram.com/clutchleague_football/",
          label: "Clutch League na Instagramu",
        },
      ]}
      mainLinks={[
        { href: "/kontakt", label: "Kontakt" },
        { href: "/prihlasit-tym", label: "Přihlásit tým" },
      ]}
      copyright={{
        text: "© 2026 Clutch League",
        license: "Všechna práva vyhrazena",
      }}
    />
  );
}
