import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface XUser {
  id: string;
  username: string;
}

interface XTweet {
  id: string;
  author_id: string;
  created_at: string;
  text: string;
  public_metrics?: {
    impression_count?: number;
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
  };
}

export async function POST(req: NextRequest) {
  let cashtag: string;
  let bearerToken: string;
  try {
    const body = await req.json();
    cashtag = String(body.cashtag || "").replace(/^\$+/, "").trim();
    bearerToken = String(body.bearerToken || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!cashtag) {
    return NextResponse.json({ error: "Missing cashtag." }, { status: 400 });
  }
  if (!bearerToken) {
    return NextResponse.json({ error: "Missing X Bearer Token." }, { status: 400 });
  }

  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    query: `$${cashtag} -is:retweet`,
    start_time: startTime,
    max_results: "100",
    // relevancy surfaces the most-engaged posts; recency (default) would only
    // return the newest tweets, missing high-impression posts in the window.
    sort_order: "relevancy",
    "tweet.fields": "public_metrics,created_at,author_id",
    expansions: "author_id",
    "user.fields": "username",
  });

  let xRes: Response;
  try {
    xRes = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach the X API." },
      { status: 502 }
    );
  }

  const data = await xRes.json().catch(() => ({}));

  if (!xRes.ok) {
    const detail =
      data?.detail || data?.title || data?.errors?.[0]?.message || "";
    const messages: Record<number, string> = {
      401: "X API authentication failed — check your Bearer Token.",
      403: "X API access forbidden — your token lacks the required access level.",
      429: "X API rate limit hit — wait a moment and try again.",
    };
    return NextResponse.json(
      {
        error: messages[xRes.status] || `X API error (${xRes.status}). ${detail}`,
      },
      { status: xRes.status }
    );
  }

  const users: Record<string, string> = {};
  for (const u of (data?.includes?.users as XUser[]) || []) {
    users[u.id] = u.username;
  }

  const tweets = (data?.data as XTweet[]) || [];
  const posts = tweets
    .map((t) => {
      const username = users[t.author_id] || "unknown";
      const m = t.public_metrics || {};
      return {
        postId: t.id,
        username,
        authorId: t.author_id,
        impressions: m.impression_count ?? 0,
        likes: m.like_count ?? 0,
        retweets: m.retweet_count ?? 0,
        replies: m.reply_count ?? 0,
        createdAt: t.created_at,
        text: t.text,
        url: `https://x.com/${username}/status/${t.id}`,
      };
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  return NextResponse.json({ posts });
}
