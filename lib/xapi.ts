import type { XPost } from "./types";
import { loadToken } from "./crypto";

export function normalizeCashtag(input: string): string {
  return input.trim().replace(/^\$+/, "").toUpperCase();
}

/**
 * Fetch top posts for a cashtag, ranked by impressions over the last 7 days.
 * Decrypts the stored Bearer token in-memory and proxies through our own
 * route handler (X API v2 has no browser CORS).
 */
export async function fetchTopPosts(cashtagInput: string): Promise<XPost[]> {
  const cashtag = normalizeCashtag(cashtagInput);
  if (!cashtag) throw new Error("Enter a cashtag.");

  const bearerToken = await loadToken();
  if (!bearerToken) {
    throw new Error("No X API token saved. Add your Bearer Token first.");
  }

  const res = await fetch("/api/x/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cashtag, bearerToken }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `X API request failed (${res.status}).`);
  }
  return json.posts as XPost[];
}
