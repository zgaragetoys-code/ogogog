"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/avatar";
import { createBoardPost, deleteBoardPost } from "./actions";
import type { AvatarStyle } from "@/types/database";

type PostProfile = {
  username: string | null;
  display_name: string | null;
  avatar_seed: string | null;
  avatar_style: AvatarStyle | null;
};

export type BoardPost = {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  created_at: string;
  profile: PostProfile | null;
};

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  general:     { label: "General",     color: "bg-gray-100 text-gray-700 border-gray-300" },
  buying:      { label: "Buying",      color: "bg-green-100 text-green-800 border-green-300" },
  selling:     { label: "Selling",     color: "bg-blue-100 text-blue-800 border-blue-300" },
  trading:     { label: "Trading",     color: "bg-purple-100 text-purple-800 border-purple-300" },
  looking_for: { label: "Looking For", color: "bg-orange-100 text-orange-800 border-orange-300" },
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PostCard({
  post,
  currentUserId,
  isAdmin,
  onDelete,
}: {
  post: BoardPost;
  currentUserId: string | null;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const canDelete = post.user_id === currentUserId || isAdmin;
  const typeInfo = POST_TYPE_LABELS[post.post_type] ?? POST_TYPE_LABELS.general;
  const seed = post.profile?.avatar_seed ?? post.user_id;
  const style = (post.profile?.avatar_style ?? "identicon") as AvatarStyle;
  const name = post.profile?.display_name ?? post.profile?.username ?? "Collector";
  const username = post.profile?.username ?? null;

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    await deleteBoardPost(post.id);
    onDelete(post.id);
  }

  return (
    <article className="border-b-2 border-black p-4 hover:bg-gray-50 transition-colors group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {username ? (
            <Link href={`/u/${username}`}>
              <img src={avatarUrl(style, seed)} alt={name} className="keep-round w-10 h-10" />
            </Link>
          ) : (
            <img src={avatarUrl(style, seed)} alt={name} className="keep-round w-10 h-10" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-black">{name}</span>
            {username && (
              <Link href={`/u/${username}`} className="text-xs text-gray-700 hover:text-black transition-colors">
                @{username}
              </Link>
            )}
            <span className={`text-[10px] font-black px-2 py-0.5 uppercase border ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className="text-[10px] text-gray-600 ml-auto">{timeLabel(post.created_at)}</span>
          </div>

          {/* Post text */}
          <p className="text-sm text-black leading-relaxed break-words whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Delete */}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete post"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 shrink-0 self-start mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}

interface Props {
  initialPosts: BoardPost[];
  currentUserId: string | null;
  currentUserProfile: PostProfile | null;
  isAdmin: boolean;
}

export default function BoardClient({ initialPosts, currentUserId, currentUserProfile, isAdmin }: Props) {
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("board_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "board_posts" },
        async (payload) => {
          const newPost = payload.new as { id: string; user_id: string; content: string; post_type: string; created_at: string };
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_seed, avatar_style")
            .eq("id", newPost.user_id)
            .single();
          setPosts((prev) => [
            { ...newPost, profile: profile as PostProfile | null },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c <= 1 ? 0 : c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || isPending || cooldown > 0) return;
    setError("");

    startTransition(async () => {
      const result = await createBoardPost(content.trim(), postType);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        setCooldown(30);
      }
    });
  }

  const filteredPosts = filter === "all" ? posts : posts.filter(p => p.post_type === filter);

  return (
    <div>
      {/* Compose box — only for logged-in users */}
      {currentUserId && (
        <div className="border-2 border-black mb-0">
          <div className="p-4 border-b-2 border-black bg-gray-50">
            <div className="flex gap-3">
              {currentUserProfile && (
                <img
                  src={avatarUrl(
                    (currentUserProfile.avatar_style ?? "identicon") as AvatarStyle,
                    currentUserProfile.avatar_seed ?? currentUserId
                  )}
                  alt=""
                  className="keep-round w-10 h-10 shrink-0"
                />
              )}
              <form onSubmit={handleSubmit} className="flex-1 min-w-0">
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value.slice(0, 500))}
                  placeholder="Buying in bulk? Looking for something specific? Let the community know…"
                  rows={3}
                  disabled={isPending || cooldown > 0}
                  className="w-full border-2 border-black px-3 py-2 text-sm resize-none focus:outline-none disabled:bg-gray-100 disabled:text-gray-700"
                />
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <select
                    value={postType}
                    onChange={e => setPostType(e.target.value)}
                    className="text-xs border-2 border-black px-2 py-1.5 focus:outline-none bg-white font-bold"
                  >
                    {Object.entries(POST_TYPE_LABELS).map(([v, { label }]) => (
                      <option key={v} value={v}>{label}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-600 ml-auto">{content.length}/500</span>
                  <button
                    type="submit"
                    disabled={!content.trim() || isPending || cooldown > 0}
                    className="text-sm px-4 py-1.5 bg-black text-white font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                  >
                    {cooldown > 0 ? `Wait ${cooldown}s` : isPending ? "Posting…" : "Post"}
                  </button>
                </div>
                {error && <p className="text-xs font-bold text-red-600 mt-1.5">{error}</p>}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-0 border-2 border-t-0 border-black mb-0 overflow-x-auto">
        {[{ key: "all", label: "All" }, ...Object.entries(POST_TYPE_LABELS).map(([k, v]) => ({ key: k, label: v.label }))].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-black uppercase px-3 py-2 shrink-0 border-r-2 border-black last:border-r-0 transition-colors ${
              filter === key ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="border-2 border-t-0 border-black divide-y-0">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-gray-700">
              {filter === "all" ? "No posts yet. Start a conversation!" : `No ${filter.replace("_", " ")} posts yet.`}
            </p>
            {!currentUserId && (
              <Link href="/auth/login?next=/board" className="mt-3 inline-block text-sm font-bold text-black underline hover:no-underline">
                Sign in to post →
              </Link>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {!currentUserId && filteredPosts.length > 0 && (
        <div className="border-2 border-t-0 border-black p-4 text-center bg-gray-50">
          <p className="text-sm text-gray-700">
            <Link href="/auth/login?next=/board" className="font-bold text-black underline hover:no-underline">Sign in</Link>
            {" "}to post and join the conversation.
          </p>
        </div>
      )}
    </div>
  );
}
