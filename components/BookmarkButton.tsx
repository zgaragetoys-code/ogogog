"use client";

import { useState, useTransition } from "react";
import { toggleBookmark } from "@/app/(site)/bookmarks/actions";

interface Props {
  targetType: "listing" | "user";
  targetId: string;
  initialBookmarked: boolean;
  size?: "sm" | "md";
  onUnbookmark?: () => void;
}

export default function BookmarkButton({
  targetType,
  targetId,
  initialBookmarked,
  size = "md",
  onUnbookmark,
}: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [animating, setAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    startTransition(async () => {
      const result = await toggleBookmark(targetType, targetId);
      if ("bookmarked" in result) {
        setBookmarked(result.bookmarked);
        if (!result.bookmarked) onUnbookmark?.();
      }
    });
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={bookmarked ? "Remove bookmark" : "Bookmark"}
      style={{
        transform: animating ? "scale(1.35)" : "scale(1)",
        transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background-color 0.15s ease, color 0.15s ease",
      }}
      className={`
        ${btnSize} border-2 flex items-center justify-center transition-colors
        ${bookmarked
          ? "bg-black border-black text-white"
          : "bg-white border-black text-black hover:bg-black hover:text-white"
        }
        ${animating ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]" : ""}
      `}
    >
      <svg
        className={iconSize}
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
