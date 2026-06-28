const STORAGE_KEY = "moviex_watchlist";

export interface WatchlistEntry {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  addedAt: number;
}

function readList(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
  } catch {
    return [];
  }
}

function writeList(list: WatchlistEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getWatchlist(): WatchlistEntry[] {
  return readList().sort((a, b) => b.addedAt - a.addedAt);
}

export function isInWatchlist(id: number): boolean {
  return readList().some((e) => e.id === id);
}

export function addToWatchlist(entry: Omit<WatchlistEntry, "addedAt">): void {
  if (typeof window === "undefined") return;
  const list = readList().filter((e) => e.id !== entry.id);
  list.unshift({ ...entry, addedAt: Date.now() });
  writeList(list);
}

export function removeFromWatchlist(id: number): void {
  if (typeof window === "undefined") return;
  writeList(readList().filter((e) => e.id !== id));
}

export function toggleWatchlist(entry: Omit<WatchlistEntry, "addedAt">): boolean {
  if (isInWatchlist(entry.id)) {
    removeFromWatchlist(entry.id);
    return false;
  }
  addToWatchlist(entry);
  return true;
}
