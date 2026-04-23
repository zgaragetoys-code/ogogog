"use client";

import { useState, useTransition } from "react";
import { triggerBotTick } from "./actions";

export default function BotTickButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleTick(count: number) {
    startTransition(async () => {
      const res = await triggerBotTick(count);
      setResult(res.ok ? `✓ Sent ${res.sent} messages` : "✗ Tick failed");
      setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[4, 8, 15, 30].map((n) => (
        <button
          key={n}
          onClick={() => handleTick(n)}
          disabled={isPending}
          className="text-xs px-3 py-1.5 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          {isPending ? "…" : `Fire ${n} bots`}
        </button>
      ))}
      {result && (
        <span className={`text-xs font-bold ml-2 ${result.startsWith("✓") ? "text-green-700" : "text-red-600"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
