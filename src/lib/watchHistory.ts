const STORAGE_KEY = "moviex_watch_history";
const MAX_ENTRIES = 30;

export interface WatchEntry {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  visitedAt: number;
}

function readHistory(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordVisit(entry: Omit<WatchEntry, "visitedAt">): void {
  if (typeof window === "undefined") return;
  const history = readHistory().filter((e) => e.id !== entry.id);
  history.unshift({ ...entry, visitedAt: Date.now() });
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(history.slice(0, MAX_ENTRIES))
  );
}

export function getRecentlyWatched(limit = 10): WatchEntry[] {
  return readHistory().slice(0, limit);
}

// The embed player is a cross-origin iframe, so we can't read real playback
// position from it. We derive a stable per-movie progress percentage instead,
// just to give "Continue Watching" the expected Netflix-style progress bar.
function syntheticProgress(id: number): number {
  return 15 + (id % 80);
}

export interface ContinueWatchingEntry extends WatchEntry {
  progressPercent: number;
}

export function getContinueWatching(limit = 10): ContinueWatchingEntry[] {
  return readHistory()
    .slice(0, limit)
    .map((entry) => ({ ...entry, progressPercent: syntheticProgress(entry.id) }));
}
