/**
 * Virality score used to rank posts.
 *
 * We rank by engagement (likes + reposts) rather than impressions: the X API's
 * `impression_count` is widely reported to return values far below the real
 * "views" (often near zero), whereas likes/retweets are reliable. Reposts are
 * weighted higher since they drive reach.
 */
export function engagementScore(p: {
  likes?: number;
  retweets?: number;
}): number {
  return (p.likes ?? 0) + (p.retweets ?? 0) * 2;
}
