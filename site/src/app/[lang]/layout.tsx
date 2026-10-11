import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Barlow, Exo_2, Fira_Sans } from "next/font/google";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";
import SiteFooter from "@/components/SiteFooter";
import { I18nProvider } from "@/i18n/client";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/config";
import { clientDictionary, getDictionaryFor } from "@/i18n/dictionaries";
import "../globals.css";

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-chakra-petch",
  display: "swap",
});

const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

// Chakra Petch ani Barlow nemají azbuku. Ukrajinská verze proto používá
// podobná písma s azbukou (globals.css, html[lang="uk"]). Bez preloadu —
// v ostatních jazycích se vůbec nestahují.
const exo2 = Exo_2({
  style: ["normal", "italic"],
  subsets: ["cyrillic", "latin"],
  variable: "--font-exo2",
  display: "swap",
  preload: false,
});

const firaSans = Fira_Sans({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["cyrillic", "latin"],
  variable: "--font-fira",
  display: "swap",
  preload: false,
});

// Každý jazyk má vlastní statické stránky. Čeština je na adresách bez
// předpony — proxy (src/proxy.ts) je sem interně přesměruje na /cs.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = getDictionaryFor(isLocale(lang) ? lang : DEFAULT_LOCALE);
  return {
    title: t.meta.siteTitle,
    description: t.meta.siteDescription,
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  // Neplatný jazyk (adresa mimo proxy, např. /neco.txt) — stránka pak vrátí 404.
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionaryFor(locale);

  return (
    <html
      lang={locale}
      className={`${chakraPetch.variable} ${barlow.variable} ${exo2.variable} ${firaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-page)]">
        <I18nProvider locale={locale} t={clientDictionary(t)}>
          <PageTransition>
            <Nav />
            {children}
            <SiteFooter />
          </PageTransition>
        </I18nProvider>
      </body>
    </html>
  );
}
