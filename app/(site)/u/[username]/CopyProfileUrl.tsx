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
      className="text-sm text-blue-600 hover:underline whitespace-nowrap"
    >
      {copied ? "Copied!" : "Share profile"}
    </button>
  );
}
