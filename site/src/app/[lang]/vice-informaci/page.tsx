import { redirect } from "next/navigation";
import { localeHref } from "@/i18n/server";

// Animace „Jak funguje Clutch League“ a pravidla jsou teď přímo na úvodní
// stránce. Stará adresa zůstává, aby nepřestaly fungovat sdílené odkazy.
export default async function ViceInformaci() {
  redirect(`${await localeHref("/")}#jak-to-funguje`);
}
