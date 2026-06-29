import type { LeaderboardEntry, XPost } from "./types";

const PREFIX = "ansem:leaderboard:";

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

export function listCashtags(): string[] {
  if (typeof localStorage === "undefined") return [];
  const tags: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) tags.push(k.slice(PREFIX.length));
  }
  return tags;
}

/** Merge fetched posts into existing entries, dedupe by postId, keep top 8 by impressions. */
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
      excluded: prev?.excluded ?? false,
    });
  }

  return Array.from(byId.values())
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);
}
