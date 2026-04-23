"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/avatar";
import { sendChatMessage, deleteChatMessage } from "./actions";
import type { AvatarStyle } from "@/types/database";

type ChatProfile = {
  username: string | null;
  display_name: string | null;
  avatar_seed: string | null;
  avatar_style: AvatarStyle | null;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  bot_id: string | null;
  is_bot: boolean;
  content: string;
  created_at: string;
  profile: ChatProfile | null;
};

interface Props {
  initialMessages: ChatMessage[];
  currentUserId: string;
  currentUserProfile: ChatProfile;
  chatEnabled: boolean;
  isAdmin: boolean;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MessageRow({
  msg,
  isMine,
  isAdmin,
  onDelete,
}: {
  msg: ChatMessage;
  isMine: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const seed = msg.profile?.avatar_seed ?? msg.user_id;
  const style = (msg.profile?.avatar_style ?? "identicon") as AvatarStyle;
  const name = msg.profile?.display_name ?? msg.profile?.username ?? "Collector";
  // Admins can delete any message; owners can delete their own (bots never "own" messages as real users)
  const canDelete = isMine || isAdmin;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteChatMessage(msg.id);
    if (result?.error) {
      setDeleting(false);
    } else {
      onDelete(msg.id);
    }
  }

  return (
    <div
      className={`flex gap-3 items-start group py-2 px-3 hover:bg-gray-50 transition-colors ${isMine ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={avatarUrl(style, seed)}
        alt={name}
        className="keep-round w-8 h-8 shrink-0 mt-0.5"
      />
      <div className={`flex-1 min-w-0 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`flex items-baseline gap-2 mb-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-bold text-black">{name}</span>
          <span className="text-[10px] text-gray-700">{timeLabel(msg.created_at)}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <p
            className={`text-sm px-3 py-2 max-w-xs sm:max-w-sm leading-relaxed break-words border-2 ${
              isMine
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black"
            }`}
          >
            {msg.content}
          </p>
          {canDelete && hovered && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="text-gray-700 hover:text-red-600 transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatClient({
  initialMessages,
  currentUserId,
  currentUserProfile,
  chatEnabled,
  isAdmin,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription — resolve profiles/bots for new messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("global_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_chat_messages" },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            user_id: string;
            bot_id: string | null;
            content: string;
            created_at: string;
          };

          let profile: ChatProfile | null = null;

          if (newMsg.bot_id) {
            // Bots table is publicly readable
            const { data } = await supabase
              .from("bots")
              .select("username, display_name, avatar_seed, avatar_style")
              .eq("id", newMsg.bot_id)
              .single();
            profile = data as ChatProfile | null;
          } else {
            const { data } = await supabase
              .from("profiles")
              .select("username, display_name, avatar_seed, avatar_style")
              .eq("id", newMsg.user_id)
              .single();
            profile = data as ChatProfile | null;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              user_id: newMsg.user_id,
              bot_id: newMsg.bot_id,
              is_bot: !!newMsg.bot_id,
              content: newMsg.content,
              created_at: newMsg.created_at,
              profile,
            },
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isPending || cooldown > 0) return;
    setError("");

    startTransition(async () => {
      const result = await sendChatMessage(input.trim());
      if (result?.error) {
        setError(result.error);
      } else {
        setInput("");
        setCooldown(10);
      }
    });
  }

  if (!chatEnabled) {
    return (
      <div className="border-2 border-black p-8 text-center space-y-3">
        <p className="text-sm font-bold text-black">Global chat is disabled in your settings.</p>
        <Link
          href="/profile"
          className="inline-block text-sm font-bold text-black underline hover:no-underline"
        >
          Re-enable in profile settings →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-2 border-black" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
      {/* Message feed */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-gray-700 font-medium">
            No messages yet — be the first to say something!
          </div>
        )}
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            isMine={msg.user_id === currentUserId && !msg.is_bot}
            isAdmin={isAdmin}
            onDelete={handleDelete}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t-2 border-black p-3">
        {error && (
          <p className="text-xs font-bold text-red-600 mb-2">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 280))}
            placeholder={cooldown > 0 ? `Wait ${cooldown}s…` : "Say something…"}
            disabled={cooldown > 0 || isPending}
            className="flex-1 border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-0 disabled:bg-gray-100 disabled:text-gray-700"
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending || cooldown > 0}
            className="px-4 py-2 bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
          >
            {cooldown > 0 ? `${cooldown}s` : "Send"}
          </button>
        </form>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-gray-700">{input.length}/280</span>
          <Link href="/profile" className="text-[10px] text-gray-700 hover:text-black transition-colors">
            Chat settings
          </Link>
        </div>
      </div>
    </div>
  );
}
