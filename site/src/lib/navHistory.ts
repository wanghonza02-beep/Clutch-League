// In-site navigation trail. The browser history also holds entries from other
// sites (e.g. a search engine), so "back" must only use router.back() when the
// previous entry is known to be one of our own pages.
const trail: string[] = [];

export function recordPath(path: string) {
  if (trail.length > 1 && trail[trail.length - 2] === path) trail.pop();
  else if (trail[trail.length - 1] !== path) trail.push(path);
}

export function hasInSiteHistory() {
  return trail.length > 1;
}
