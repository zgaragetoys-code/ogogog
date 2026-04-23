"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/avatar";
import BookmarkButton from "@/components/BookmarkButton";
import type { AvatarStyle } from "@/types/database";

type SavedListing = {
  id: string;
  listing_type: string;
  price: number | null;
  price_type: string;
  title: string | null;
  listing_image_url: string | null;
  card: { name: string; image_url: string | null } | null;
  status: string;
};

type SavedUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_seed: string | null;
  avatar_style: AvatarStyle | null;
};

export default function BookmarksPage() {
  const [tab, setTab] = useState<"listings" | "users">("listings");
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [users, setUsers] = useState<SavedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const [{ data: listingBookmarks }, { data: userBookmarks }] =
        await Promise.all([
          supabase
            .from("bookmarks")
            .select("target_id")
            .eq("target_type", "listing")
            .order("created_at", { ascending: false }),
          supabase
            .from("bookmarks")
            .select("target_id")
            .eq("target_type", "user")
            .order("created_at", { ascending: false }),
        ]);

      const listingIds = (listingBookmarks ?? []).map((b) => b.target_id);
      const userIds = (userBookmarks ?? []).map((b) => b.target_id);

      const [listingData, userData] = await Promise.all([
        listingIds.length > 0
          ? supabase
              .from("listings")
              .select(
                "id, listing_type, price, price_type, title, listing_image_url, status, card:cards!card_id(name, image_url)"
              )
              .in("id", listingIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, username, display_name, avatar_seed, avatar_style")
              .in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Preserve bookmark order
      const listingMap = new Map(
        ((listingData.data ?? []) as unknown as SavedListing[]).map((l) => [l.id, l])
      );
      const userMap = new Map(
        ((userData.data ?? []) as unknown as SavedUser[]).map((u) => [u.id, u])
      );

      setListings(listingIds.map((id) => listingMap.get(id)).filter(Boolean) as SavedListing[]);
      setUsers(userIds.map((id) => userMap.get(id)).filter(Boolean) as SavedUser[]);
      setLoading(false);
    }
    load();
  }, []);

  function removeBookmark(type: "listing" | "user", id: string) {
    if (type === "listing") setListings((prev) => prev.filter((l) => l.id !== id));
    else setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-6 border-b-2 border-black pb-4">
          Bookmarks
        </h1>

        {/* Tab switcher */}
        <div className="flex border-2 border-black mb-6">
          <button
            onClick={() => setTab("listings")}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
              tab === "listings"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-2.5 text-sm font-bold border-l-2 border-black transition-colors ${
              tab === "users"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-50"
            }`}
          >
            Collectors
          </button>
        </div>

        {loading && (
          <div className="text-sm text-gray-700 font-medium py-8 text-center">Loading…</div>
        )}

        {/* Listings tab */}
        {!loading && tab === "listings" && (
          <div>
            {listings.length === 0 ? (
              <div className="border-2 border-black p-10 text-center">
                <p className="text-sm font-bold text-black mb-1">No saved listings</p>
                <p className="text-xs text-gray-700">Click the bookmark icon on any listing to save it here.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
                {listings.map((l) => {
                  const name = l.card?.name ?? l.title ?? "Untitled";
                  const imgUrl = l.listing_image_url ?? l.card?.image_url ?? null;
                  const isSold = l.status !== "active";
                  return (
                    <div key={l.id} className="flex items-center gap-3 p-4">
                      <div className="w-12 h-16 bg-gray-100 shrink-0 overflow-hidden border border-black/10">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/listings/${l.id}`}
                          className={`text-sm font-bold hover:underline ${isSold ? "text-gray-700 line-through" : "text-black"}`}
                        >
                          {name}
                        </Link>
                        <p className="text-xs text-gray-700 mt-0.5">
                          {l.listing_type === "for_sale" ? "For Sale" : "Wanted"}
                          {l.price != null && l.price_type !== "open_to_offers"
                            ? ` · $${Number(l.price).toFixed(2)}`
                            : l.price_type === "open_to_offers"
                            ? " · Make offer"
                            : ""}
                        </p>
                        {isSold && (
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-wide">
                            {l.status}
                          </span>
                        )}
                      </div>
                      <BookmarkButton
                        targetType="listing"
                        targetId={l.id}
                        initialBookmarked
                        size="sm"
                        onUnbookmark={() => removeBookmark("listing", l.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Users tab */}
        {!loading && tab === "users" && (
          <div>
            {users.length === 0 ? (
              <div className="border-2 border-black p-10 text-center">
                <p className="text-sm font-bold text-black mb-1">No saved collectors</p>
                <p className="text-xs text-gray-700">Click the bookmark icon on any collector&apos;s profile to follow them here.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
                {users.map((u) => {
                  const name = u.display_name ?? u.username ?? "Unknown";
                  const seed = u.avatar_seed ?? u.id;
                  const style = (u.avatar_style ?? "identicon") as AvatarStyle;
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-4">
                      <img
                        src={avatarUrl(style, seed)}
                        alt={name}
                        className="keep-round w-10 h-10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={u.username ? `/u/${u.username}` : "#"}
                          className="text-sm font-bold text-black hover:underline"
                        >
                          {name}
                        </Link>
                        {u.username && (
                          <p className="text-xs text-gray-700">@{u.username}</p>
                        )}
                      </div>
                      <BookmarkButton
                        targetType="user"
                        targetId={u.id}
                        initialBookmarked
                        size="sm"
                        onUnbookmark={() => removeBookmark("user", u.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
