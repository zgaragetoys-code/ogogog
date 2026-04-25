"use client";

import { useState } from "react";

export default function CopyProfileUrl({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.origin + `/u/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest text-center hover:bg-black hover:text-white transition-colors"
    >
      {copied ? "Copied!" : "Share profile"}
    </button>
  );
}
