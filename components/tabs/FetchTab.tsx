"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { fetchTopPosts, normalizeCashtag } from "@/lib/xapi";
import { hasToken } from "@/lib/crypto";
import type { XPost } from "@/lib/types";

interface Props {
  cashtag: string;
  setCashtag: (v: string) => void;
  onAdd: (posts: XPost[]) => void;
  onNeedApiKey: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString();
}

export function FetchTab({ cashtag, setCashtag, onAdd, onNeedApiKey }: Props) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<XPost[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!hasToken()) {
      toast("error", "Add your X API token first.");
      onNeedApiKey();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTopPosts(cashtag);
      setPosts(result);
      setExcluded(new Set());
      if (result.length === 0)
        toast("info", "No posts found for that cashtag in the last 7 days.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fetch failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExclude = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const kept = posts.filter((p) => !excluded.has(p.postId));

  const handleAdd = () => {
    if (kept.length === 0) {
      toast("error", "No posts to add.");
      return;
    }
    onAdd(kept.slice(0, 8));
    toast("success", `Added ${Math.min(kept.length, 8)} post(s) to leaderboard.`);
  };

  return (
    <div className="space-y-5">
      <div className="corners card p-5 sm:p-6">
        <div className="hud-label mb-3">Target cashtag</div>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neon">
              $
            </span>
            <input
              value={cashtag}
              onChange={(e) => setCashtag(normalizeCashtag(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="ANSEM"
              className="input-base pl-7 font-mono uppercase"
            />
          </div>
          <button
            onClick={handleFetch}
            disabled={loading || !cashtag}
            className="btn-neon"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" /> Fetching…
              </>
            ) : (
              "Fetch Top Posts"
            )}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          Top posts by impressions over the last 7 days. Toggle off suspected
          bot/fake posts before adding to the leaderboard.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {posts.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-white/55">
              {kept.length} kept ·{" "}
              <span className="text-white/35">{excluded.size} excluded</span>
            </div>
            <button onClick={handleAdd} className="btn-neon !py-2">
              Add top {Math.min(kept.length, 8)} to Leaderboard →
            </button>
          </div>

          <div className="space-y-2">
            {posts.map((p, i) => {
              const isOut = excluded.has(p.postId);
              return (
                <div
                  key={p.postId}
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                  className={`card animate-fade-up flex items-start gap-3 p-3 transition hover:border-white/20 ${
                    isOut ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex w-8 shrink-0 flex-col items-center pt-1">
                    <span className="font-mono text-sm font-bold text-neon">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="font-semibold text-white">
                        @{p.username}
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="text-white/40">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 line-clamp-2 text-sm text-white/60 ${
                        isOut ? "line-through" : ""
                      }`}
                    >
                      {p.text}
                    </p>
                    <div className="mt-1.5 flex items-center gap-4 text-xs text-white/40">
                      <span>
                        <span className="font-mono font-semibold text-neon">
                          {fmt(p.impressions)}
                        </span>{" "}
                        impressions
                      </span>
                      <span>{fmt(p.likes)} likes</span>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/55 hover:text-neon hover:underline"
                      >
                        View post ↗
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExclude(p.postId)}
                    className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                      isOut
                        ? "border-neon/50 text-neon hover:bg-neon/10"
                        : "border-red-500/30 text-red-300 hover:bg-red-500/10"
                    }`}
                  >
                    {isOut ? "Restore" : "Mark bot"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {posts.length === 0 && !loading && !error && (
        <div className="card p-10 text-center text-sm text-white/40">
          Enter a cashtag and fetch to see the most viral posts.
        </div>
      )}
    </div>
  );
}
