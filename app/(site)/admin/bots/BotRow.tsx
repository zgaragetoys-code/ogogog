"use client";

import { useState, useTransition } from "react";
import { toggleBot } from "./actions";

type Bot = {
  id: string;
  username: string;
  display_name: string;
  personality: string;
  chat_enabled: boolean;
  posting_enabled: boolean;
  last_active_at: string | null;
};

const PERSONALITY_COLORS: Record<string, string> = {
  casual: "bg-gray-100 text-gray-700",
  hype: "bg-orange-100 text-orange-700",
  vintage: "bg-purple-100 text-purple-700",
  competitive: "bg-blue-100 text-blue-700",
  sealed: "bg-teal-100 text-teal-700",
  grader: "bg-yellow-100 text-yellow-800",
  investor: "bg-green-100 text-green-700",
};

function Toggle({
  enabled,
  onToggle,
  pending,
}: {
  enabled: boolean;
  onToggle: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className={`relative w-10 h-5 border-2 border-black transition-colors focus:outline-none disabled:opacity-40 ${
        enabled ? "bg-black" : "bg-white"
      }`}
    >
      <span
        className={`absolute top-0.5 w-3 h-3 transition-transform ${
          enabled ? "translate-x-4 bg-white" : "translate-x-0.5 bg-gray-400"
        }`}
      />
    </button>
  );
}

export default function BotRow({ bot }: { bot: Bot }) {
  const [chatEnabled, setChatEnabled] = useState(bot.chat_enabled);
  const [postingEnabled, setPostingEnabled] = useState(bot.posting_enabled);
  const [isPending, startTransition] = useTransition();

  const lastActive = bot.last_active_at
    ? new Date(bot.last_active_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "never";

  function handleChat() {
    const next = !chatEnabled;
    setChatEnabled(next);
    startTransition(() => toggleBot(bot.id, "chat_enabled", next));
  }

  function handlePosting() {
    const next = !postingEnabled;
    setPostingEnabled(next);
    startTransition(() => toggleBot(bot.id, "posting_enabled", next));
  }

  return (
    <div className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 transition-colors ${isPending ? "opacity-60" : "hover:bg-gray-50"}`}>
      <div className="min-w-0">
        <p className="text-sm font-bold text-black truncate">@{bot.username}</p>
        <p className="text-xs text-gray-700 truncate">{bot.display_name} · last active {lastActive}</p>
      </div>
      <div className="w-20 text-center">
        <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase ${PERSONALITY_COLORS[bot.personality] ?? "bg-gray-100 text-gray-700"}`}>
          {bot.personality}
        </span>
      </div>
      <div className="w-16 flex justify-center">
        <Toggle enabled={chatEnabled} onToggle={handleChat} pending={isPending} />
      </div>
      <div className="w-16 flex justify-center">
        <Toggle enabled={postingEnabled} onToggle={handlePosting} pending={isPending} />
      </div>
    </div>
  );
}
