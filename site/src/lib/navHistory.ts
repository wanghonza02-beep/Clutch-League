// In-site navigation trail. The browser history also holds entries from other
// sites (e.g. a search engine), so "back" must only use router.back() when the
// previous entry is known to be one of our own pages.
//
// The trail mirrors the browser history for our pages: a navigation that came
// from the browser's back/forward (popstate) steps back in the trail, anything
// else (links, router.push, redirects after a form) adds a new entry.
const trail: string[] = [];
let poppedAt = 0;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    poppedAt = Date.now();
  });
}

export function recordPath(path: string) {
  const fromPopstate = Date.now() - poppedAt < 2000;
  poppedAt = 0;
  if (trail[trail.length - 1] === path) return;
  if (fromPopstate && trail.length > 1 && trail[trail.length - 2] === path) trail.pop();
  else trail.push(path);
}

/** Our pages before the current one, nearest first. */
export function previousPaths(): string[] {
  return trail.slice(0, -1).reverse();
}
