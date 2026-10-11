import { revalidatePath } from "next/cache";

/**
 * Obnoví stránku ve všech jazycích. Stránky leží pod app/[lang] a čeština se
 * na ně dostává přepisem v proxy — revalidatePath proto potřebuje cestu podle
 * souborů (/[lang]/turnaje), ne adresu z prohlížeče (/turnaje).
 */
export function revalidateRoute(path: string, type: "page" | "layout" = "page"): void {
  revalidatePath(path === "/" ? "/[lang]" : `/[lang]${path}`, type);
}
