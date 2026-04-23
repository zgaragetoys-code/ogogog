"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { avatarUrl } from "@/lib/avatar";
import type { AvatarStyle } from "@/types/database";

type UserResult = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_seed: string | null;
  avatar_style: AvatarStyle | null;
  listings: { id: string; title: string; listing_type: string; price: number | null; status: string }[];
};

export default function NewConversation({ users }: { users: UserResult[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    // When no query, show all users (up to 30)
    if (!q) return users.slice(0, 30);
    return users
      .filter(
        (u) =>
          (u.display_name ?? "").toLowerCase().includes(q) ||
          (u.username ?? "").toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, users]);

  function reset() {
    setOpen(false);
    setQuery("");
    setSelectedUser(null);
  }

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-bold px-4 py-2 border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
        >
          + New conversation
        </button>
      ) : (
        <div className="border-2 border-black">
          <div className="flex items-center gap-3 p-4 border-b-2 border-black bg-gray-50">
            <span className="text-sm font-black uppercase tracking-wide text-black">New conversation</span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh user list"
              className="text-xs font-bold text-gray-700 hover:text-black transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <button onClick={reset} className="ml-auto text-xs font-bold text-gray-700 hover:text-black">
              ✕ Cancel
            </button>
          </div>

          {/* Search input */}
          {!selectedUser && (
            <div className="p-4">
              <input
                autoFocus
                type="text"
                placeholder="Search by name or username…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-0 font-medium"
              />

              {query.trim() && results.length === 0 && (
                <p className="text-sm text-gray-700 mt-3 px-1">
                  No users found matching &ldquo;{query}&rdquo;
                </p>
              )}

              {results.length > 0 && (
                <div className="mt-3 divide-y divide-black/10 border-t border-black/10 max-h-64 overflow-y-auto">
                  {results.map((u) => {
                    const name = u.display_name ?? u.username ?? "Unknown";
                    const seed = u.avatar_seed ?? u.id;
                    const style = u.avatar_style ?? "identicon";
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setQuery("");
                        }}
                        className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={avatarUrl(style, seed)}
                          alt={name}
                          className="keep-round w-8 h-8 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-bold text-black">{name}</p>
                          {u.username && u.display_name && (
                            <p className="text-xs text-gray-700">@{u.username}</p>
                          )}
                        </div>
                        <span className="ml-auto text-xs text-gray-700 shrink-0">
                          {u.listings.length > 0
                            ? `${u.listings.length} listing${u.listings.length !== 1 ? "s" : ""}`
                            : ""}
                        </span>
                      </button>
                    );
                  })}
                  {!query.trim() && users.length > 30 && (
                    <p className="text-xs text-gray-700 px-1 py-2 text-center">
                      Showing 30 of {users.length} — search to narrow down
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Listing / chat picker */}
          {selectedUser && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={avatarUrl(
                    selectedUser.avatar_style ?? "identicon",
                    selectedUser.avatar_seed ?? selectedUser.id
                  )}
                  alt=""
                  className="keep-round w-8 h-8"
                />
                <div>
                  <p className="text-sm font-black text-black">
                    {selectedUser.display_name ?? selectedUser.username}
                  </p>
                  {selectedUser.username && selectedUser.display_name && (
                    <p className="text-xs text-gray-700">@{selectedUser.username}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="ml-auto text-xs font-bold text-gray-700 hover:text-black"
                >
                  ← Back
                </button>
              </div>

              {/* General chat CTA */}
              <Link
                href={`/messages/direct/${selectedUser.id}`}
                className="flex items-center justify-between w-full px-4 py-3 mb-4 bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors"
              >
                <span>💬 General chat</span>
                <span className="text-xs font-normal opacity-70">Not about a listing</span>
              </Link>

              {/* Listing-scoped threads */}
              {selectedUser.listings.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Or message about a listing:
                  </p>
                  <div className="divide-y divide-black/10 border-t border-black/10">
                    {selectedUser.listings.map((l) => (
                      <Link
                        key={l.id}
                        href={`/messages/${l.id}/${selectedUser.id}`}
                        className="flex items-center gap-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{l.title}</p>
                          <p className="text-xs text-gray-700">
                            {l.listing_type === "for_sale" ? "For Sale" : "Wanted"}
                            {l.price != null && ` · $${Number(l.price).toFixed(2)}`}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-black shrink-0">Message →</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
