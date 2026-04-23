import { createClient } from "@/lib/supabase/server";
import { Fragment, Suspense } from "react";
import Link from "next/link";
import BrowseFilters from "./BrowseFilters";
import BrowseRealtimeRefresher from "./BrowseRealtimeRefresher";
import ListingCard, { type FeedListing } from "./ListingCard";
import { avatarUrl } from "@/lib/avatar";
import type { ConditionType, ListingType, ProductType, AvatarStyle } from "@/types/database";

const PAGE_SIZE = 24;

const LISTING_SELECT =
  "id, listing_type, condition_type, raw_condition, sealed_condition, " +
  "grading_company, grade, condition_generic, price_type, price, " +
  "is_featured, created_at, set_year, set_series, " +
  "title, custom_category, listing_image_url, " +
  "card:cards!card_id(name, set_name, card_number, image_url, product_type, release_date)";

type SortKey = "newest" | "oldest" | "price_asc" | "price_desc";

function sortFeed(items: FeedListing[], sort: SortKey): FeedListing[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price_asc":
        return (a.price ?? Infinity) - (b.price ?? Infinity);
      case "price_desc":
        return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
}

function buildFeed(regular: FeedListing[], featured: FeedListing[]): FeedListing[] {
  const result: FeedListing[] = [];
  let fi = 0; let ri = 0; let slot = 0;
  while (ri < regular.length) {
    slot++;
    if (slot % 5 === 0 && fi < featured.length) result.push(featured[fi++]);
    else result.push(regular[ri++]);
  }
  return result;
}

function buildPageUrl(page: number, params: Record<string, string | null | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  if (page > 0) p.set("page", String(page));
  const qs = p.toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string; condition?: string; product?: string;
    page?: string; q?: string; sort?: string;
    min?: string; max?: string; year?: string;
    mode?: string; userq?: string;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { type, condition, product, page: pageStr, q, sort: sortRaw,
    min, max, year, mode, userq } = await searchParams;

  // ── User search mode ─────────────────────────────────────────────────────
  if (mode === "users") {
    const userQuery = userq?.trim() ?? "";
    let profileQuery = supabase
      .from("profiles")
      .select("id, username, display_name, avatar_seed, avatar_style, country, region")
      .not("username", "is", null)
      .order("username", { ascending: true })
      .limit(48);

    if (userQuery) {
      profileQuery = profileQuery.or(`username.ilike.%${userQuery}%,display_name.ilike.%${userQuery}%`);
    }
    const { data: users } = await profileQuery;

    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">Browse</h1>
            <div className="flex items-center gap-2">
              <BrowseRealtimeRefresher />
              <Link href="/listings/new" className="text-sm bg-black text-white px-4 py-2 font-bold hover:bg-zinc-800 transition-colors">
                + New listing
              </Link>
            </div>
          </div>
          <div className="mb-5"><Suspense><BrowseFilters /></Suspense></div>
          {!userQuery ? (
            <p className="text-sm text-gray-700 py-8 text-center">Enter a name to find users.</p>
          ) : (users ?? []).length === 0 ? (
            <div className="text-center py-20 border-2 border-black">
              <p className="text-black font-bold mb-2">No users found</p>
              <p className="text-sm text-gray-700">Try a different name.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">
                {(users ?? []).length} user{(users ?? []).length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {(users ?? []).map((u) => (
                  <Link key={u.id} href={`/u/${u.username}`}
                    className="border-2 border-black bg-white p-4 flex flex-col items-center gap-2 hover:shadow-[4px_4px_0px_0px_#000] transition-shadow text-center">
                    <img src={avatarUrl((u.avatar_style as AvatarStyle) ?? "identicon", u.avatar_seed ?? u.id)}
                      alt={u.display_name ?? u.username ?? ""} className="keep-round w-14 h-14" />
                    <div>
                      <p className="text-sm font-black text-black leading-tight">{u.display_name ?? u.username}</p>
                      {u.display_name && u.username && <p className="text-xs text-gray-700">@{u.username}</p>}
                    </div>
                    <span className="mt-auto text-[10px] font-bold border-2 border-black px-2 py-0.5 text-black uppercase tracking-wide">
                      View profile →
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // ── Listings mode ────────────────────────────────────────────────────────
  const page = Math.max(0, parseInt(pageStr ?? "0") || 0);
  const searchQuery = q?.trim().toLowerCase() ?? "";
  const sort = (["newest", "oldest", "price_asc", "price_desc"].includes(sortRaw ?? "") ? sortRaw : "newest") as SortKey;
  const minPrice = min ? parseFloat(min) : null;
  const maxPrice = max ? parseFloat(max) : null;
  const yearFilter = year ? parseInt(year) : null;
  const listingType = (type as ListingType) || null;
  const conditionType = (condition as ConditionType) || null;
  const productType = (product as ProductType) || null;
  const now = new Date().toISOString();

  // Featured listings
  const { data: featuredData } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .eq("is_featured", true)
    .or(`featured_until.is.null,featured_until.gt.${now}`)
    .order("created_at", { ascending: false });

  // All active listings
  let query = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .eq("is_featured", false)
    .order("created_at", { ascending: false })
    .limit(500);

  if (listingType) query = query.eq("listing_type", listingType);
  if (conditionType) query = query.eq("condition_type", conditionType);
  if (yearFilter) query = query.eq("set_year", yearFilter);

  const { data: rawData } = await query;

  const allItems = ((rawData ?? []) as unknown as FeedListing[]).filter((r) => {
    if (productType && r.card?.product_type !== productType) return false;
    if (searchQuery) {
      const nameMatch = r.card?.name?.toLowerCase().includes(searchQuery);
      const setMatch = r.card?.set_name?.toLowerCase().includes(searchQuery);
      const titleMatch = r.title?.toLowerCase().includes(searchQuery);
      if (!nameMatch && !setMatch && !titleMatch) return false;
    }
    if (minPrice !== null && (r.price === null || r.price < minPrice)) return false;
    if (maxPrice !== null && (r.price === null || r.price > maxPrice)) return false;
    return true;
  });

  // Fetch user's bookmarked listing IDs for inline save buttons
  let bookmarkedIds = new Set<string>();
  if (user) {
    const { data: bms } = await supabase
      .from("bookmarks")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("target_type", "listing");
    bookmarkedIds = new Set((bms ?? []).map((b) => b.target_id));
  }

  const featuredItems = (featuredData ?? []) as unknown as FeedListing[];
  const sorted = sortFeed(allItems, sort);
  const totalRegular = sorted.length;
  const totalPages = Math.ceil(totalRegular / PAGE_SIZE);
  const pageSlice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const feed = buildFeed(pageSlice, featuredItems);
  const hasFilters = !!(listingType || conditionType || productType || searchQuery || minPrice || maxPrice || yearFilter || (sort && sort !== "newest"));
  const urlParams = { type: listingType, condition: conditionType, product: productType, q: searchQuery || null, sort: sort !== "newest" ? sort : null, min: min || null, max: max || null, year: year || null };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Browse</h1>
          <div className="flex items-center gap-2">
            <BrowseRealtimeRefresher />
            <Link href="/listings/new" className="text-sm bg-black text-white px-4 py-2 font-bold hover:bg-zinc-800 transition-colors">
              + New listing
            </Link>
          </div>
        </div>

        <div className="mb-5">
          <Suspense><BrowseFilters /></Suspense>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-20 border-2 border-black">
            <p className="text-black font-bold mb-2">No listings found</p>
            {hasFilters
              ? <p className="text-sm text-gray-700">Try removing some filters.</p>
              : <p className="text-sm text-gray-700">Be the first to post a listing.</p>}
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">
              {totalRegular} listing{totalRegular !== 1 ? "s" : ""}{hasFilters ? " — filtered" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {feed.map((item, idx) => (
                <Fragment key={item.id}>
                  <ListingCard
                    item={item}
                    currentUserId={user?.id}
                    isBookmarked={bookmarkedIds.has(item.id)}
                  />
                  {/* ad slot — hidden until ads are enabled */}
                  {idx === 5 && <div className="hidden" />}
                  {idx === 17 && <div className="hidden" />}
                </Fragment>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                {page > 0 && (
                  <Link href={buildPageUrl(page - 1, urlParams)} className="text-sm font-bold text-black border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">← Prev</Link>
                )}
                <span className="text-sm font-bold text-black">{page + 1} / {totalPages}</span>
                {page < totalPages - 1 && (
                  <Link href={buildPageUrl(page + 1, urlParams)} className="text-sm font-bold text-black border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">Next →</Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
