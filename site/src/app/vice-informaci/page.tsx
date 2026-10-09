import { redirect } from "next/navigation";

// Animace „Jak funguje Clutch League“ a pravidla jsou teď přímo na úvodní
// stránce. Stará adresa zůstává, aby nepřestaly fungovat sdílené odkazy.
export default function ViceInformaci() {
  redirect("/#jak-to-funguje");
}
