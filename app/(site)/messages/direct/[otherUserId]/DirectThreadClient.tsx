"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendDirectMessage } from "./actions";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Props = {
  initialMessages: Message[];
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function DirectThreadClient({
  initialMessages,
  currentUserId,
  otherUserId,
  otherUserName,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Subscribe to incoming direct messages from the other user
    const channel = supabase
      .channel(`direct-${[currentUserId, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message & { sender_id: string; receiver_id: string; listing_id: string | null };
          if (msg.listing_id !== null) return;
          if (msg.sender_id !== otherUserId) return;
          setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, otherUserId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    setInput("");
    setError("");
    startTransition(async () => {
      const result = await sendDirectMessage(otherUserId, content);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.message) {
        setMessages((prev) =>
          prev.find((m) => m.id === result.message!.id) ? prev : [...prev, result.message!]
        );
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-700 py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md space-y-1 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`px-4 py-2.5 text-sm leading-relaxed ${isMe ? "bg-black text-white" : "bg-white border-2 border-black text-black"}`}>
                  {msg.content}
                </div>
                <p className="text-xs text-gray-700 px-1">{timeLabel(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t-2 border-black bg-white px-4 py-3">
        {error && <p className="text-xs text-red-600 mb-2 font-bold">{error}</p>}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={`Message ${otherUserName}…`}
            rows={1}
            maxLength={2000}
            className="flex-1 px-3 py-2 border-2 border-black text-sm text-black resize-none focus:outline-none focus:ring-0"
          />
          <button
            onClick={handleSend}
            disabled={pending || !input.trim()}
            className="px-4 py-2 bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-700 mt-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
