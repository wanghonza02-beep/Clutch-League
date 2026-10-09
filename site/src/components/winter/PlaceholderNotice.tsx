import Notice from "@/components/ui/Notice";
import { WINTER_PREVIEW } from "@/content/winter-clutch-preview";

/** Výrazné označení zástupných dat — zmizí, až bude v datech placeholder: false. */
export default function PlaceholderNotice({ what }: { what: string }) {
  if (!WINTER_PREVIEW.placeholder) return null;
  return (
    <Notice tone="accent">
      <strong>Ukázková data.</strong> {what} jsou zatím zástupné. Skutečný rozpis a soupisky
      zveřejníme po uzávěrce přihlášek.
    </Notice>
  );
}
