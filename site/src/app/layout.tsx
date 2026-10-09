import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Barlow } from "next/font/google";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Clutch League | Winter Clutch",
  description:
    "Zimní 3 na 3 turnaj Clutch League. Sežeň partu a přihlas tým na Winter Clutch.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="cs"
      className={`${chakraPetch.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-page)]">
        <PageTransition>
          <Nav />
          {children}
          <SiteFooter />
        </PageTransition>
      </body>
    </html>
  );
}
