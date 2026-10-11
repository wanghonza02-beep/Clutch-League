import { notFound } from "next/navigation";

// Adresa, která neodpovídá žádné stránce, dostane 404 v jazyce webu
// (app/[lang]/not-found.tsx) místo výchozí anglické stránky Nextu.
export default function CatchAll() {
  notFound();
}
