// Přístup k Supabase. Obě hodnoty jsou veřejné (posílají se i do prohlížeče)
// a samy o sobě nic neodemknou — co kdo smí, hlídá databáze přes RLS.
// Najdeš je v Supabase: Project Settings → API (nebo tlačítko Connect).
//
// Novější projekty mají „publishable key“ (sb_publishable_…), starší
// „anon key“ — funguje kterýkoli, stačí vyplnit jeden.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Bez vyplněných klíčů web běží dál, jen místo účtů a výsledků ukáže hlášku. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}
