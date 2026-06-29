import type { LeaderboardEntry, XPost } from "./types";

const PREFIX = "ansem:leaderboard:";
const FETCH_PREFIX = "ansem:fetch:";
const MAX_ENTRIES = 10;

function keyFor(cashtag: string): string {
  return `${PREFIX}${cashtag.toUpperCase()}`;
}

export function loadLeaderboard(cashtag: string): LeaderboardEntry[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(keyFor(cashtag));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveLeaderboard(
  cashtag: string,
  entries: LeaderboardEntry[]
): void {
  localStorage.setItem(keyFor(cashtag), JSON.stringify(entries));
}

/** Cache the last raw fetch so switching tabs / refreshing doesn't re-call the paid API. */
export function loadFetchResults(cashtag: string): XPost[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(`${FETCH_PREFIX}${cashtag.toUpperCase()}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as XPost[];
  } catch {
    return [];
  }
}

export function saveFetchResults(cashtag: string, posts: XPost[]): void {
  localStorage.setItem(
    `${FETCH_PREFIX}${cashtag.toUpperCase()}`,
    JSON.stringify(posts)
  );
}

/** Merge fetched posts into existing entries, dedupe by postId, keep top 10 by impressions. */
export function mergePosts(
  existing: LeaderboardEntry[],
  posts: XPost[]
): LeaderboardEntry[] {
  const byId = new Map<string, LeaderboardEntry>();
  for (const e of existing) byId.set(e.postId, e);

  for (const p of posts) {
    const prev = byId.get(p.postId);
    byId.set(p.postId, {
      postId: p.postId,
      username: p.username,
      impressions: p.impressions,
      createdAt: p.createdAt,
      url: p.url,
      text: p.text,
      wallet: prev?.wallet ?? "",
    });
  }

  return Array.from(byId.values())
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, MAX_ENTRIES);
}
