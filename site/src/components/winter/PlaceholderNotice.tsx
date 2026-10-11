import Notice from "@/components/ui/Notice";
import { WINTER_PREVIEW } from "@/content/winter-clutch-preview";
import { fmt } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";

/** Výrazné označení zástupných dat — zmizí, až bude v datech placeholder: false. */
export default async function PlaceholderNotice({ what }: { what: string }) {
  if (!WINTER_PREVIEW.placeholder) return null;
  const t = (await getDictionary()).winter;
  return (
    <Notice tone="accent">
      <strong>{t.placeholderStrong}</strong> {fmt(t.placeholderText, { what })}
    </Notice>
  );
}
