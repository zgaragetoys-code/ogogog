import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import BrowseFilters from "./BrowseFilters";
import BrowseRealtimeRefresher from "./BrowseRealtimeRefresher";
import ListingCard, { type FeedItem } from "./ListingCard";
import type { ConditionType, ListingType, ProductType } from "@/types/database";

const PAGE_SIZE = 24;

const CARD_SELECT =
  "id, listing_type, condition_type, raw_condition, sealed_condition, " +
  "grading_company, grade, price_type, price, is_featured, created_at, " +
  "card:cards(name, set_name, card_number, image_url, product_type)";

const CUSTOM_SELECT =
  "id, title, custom_category, condition_generic, listing_type, " +
  "price_type, price, is_featured, created_at";

type SortKey = "newest" | "oldest" | "price_asc" | "price_desc";

function sortFeed(items: FeedItem[], sort: SortKey): FeedItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime();
      case "price_asc": {
        const pa = a.data.price ?? Infinity;
        const pb = b.data.price ?? Infinity;
        return pa - pb;
      }
      case "price_desc": {
        const pa = a.data.price ?? -Infinity;
        const pb = b.data.price ?? -Infinity;
        return pb - pa;
      }
      default: // newest
        return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();
    }
  });
}

function buildFeed(regular: FeedItem[], featured: FeedItem[]): FeedItem[] {
  const result: FeedItem[] = [];
  let fi = 0;
  let ri = 0;
  let slot = 0;
  while (ri < regular.length) {
    slot++;
    if (slot % 5 === 0 && fi < featured.length) {
      result.push(featured[fi++]);
    } else {
      result.push(regular[ri++]);
    }
  }
  return result;
}

function buildPageUrl(
  page: number,
  params: Record<string, string | null | undefined>
) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  if (page > 0) p.set("page", String(page));
  const qs = p.toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

function PaginationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-bold border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
      {label}
    </Link>
  );
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string; condition?: string; product?: string;
    page?: string; q?: string; sort?: string;
    min?: string; max?: string;
  }>;
}) {
  const { type, condition, product, page: pageStr, q, sort: sortRaw, min, max } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0") || 0);
  const searchQuery = q?.trim().toLowerCase() ?? "";
  const sort = (["newest", "oldest", "price_asc", "price_desc"].includes(sortRaw ?? "") ? sortRaw : "newest") as SortKey;
  const minPrice = min ? parseFloat(min) : null;
  const maxPrice = max ? parseFloat(max) : null;

  const listingType = (type as ListingType) || null;
  const conditionType = (condition as ConditionType) || null;
  const productType = (product as ProductType) || null;

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Featured card listings — null-safe is_featured check
  const { data: featuredCards, error: featuredError } = await supabase
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("is_featured", true)
    .or(`featured_until.is.null,featured_until.gt.${now}`)
    .order("created_at", { ascending: false });

  if (featuredError) console.error("Browse featured query error:", featuredError.message);

  // Regular card listings — treat NULL is_featured the same as false
  let cardQuery = supabase
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .or("is_featured.eq.false,is_featured.is.null")
    .order("created_at", { ascending: false })
    .limit(500);

  if (listingType) cardQuery = cardQuery.eq("listing_type", listingType);
  if (conditionType) cardQuery = cardQuery.eq("condition_type", conditionType);

  // Custom listings
  let customQuery = supabase
    .from("custom_listings")
    .select(CUSTOM_SELECT)
    .eq("status", "active")
    .or("is_featured.eq.false,is_featured.is.null")
    .order("created_at", { ascending: false })
    .limit(500);

  if (listingType) customQuery = customQuery.eq("listing_type", listingType);

  const [
    { data: cardData, error: cardError },
    { data: customData, error: customError },
  ] = await Promise.all([
    cardQuery,
    conditionType || productType ? Promise.resolve({ data: [], error: null }) : customQuery,
  ]);

  if (cardError) console.error("Browse card query error:", cardError.message);
  if (customError) console.error("Browse custom query error:", customError.message);

  const cardItems: FeedItem[] = ((cardData ?? []) as unknown[])
    .filter((r) => {
      const row = r as { card: { product_type: string; name: string; set_name: string }; price: number | null };
      if (productType && row.card?.product_type !== productType) return false;
      if (searchQuery) {
        const nameMatch = row.card?.name?.toLowerCase().includes(searchQuery);
        const setMatch = row.card?.set_name?.toLowerCase().includes(searchQuery);
        if (!nameMatch && !setMatch) return false;
      }
      if (minPrice !== null && (row.price === null || row.price < minPrice)) return false;
      if (maxPrice !== null && (row.price === null || row.price > maxPrice)) return false;
      return true;
    })
    .map((r) => ({ kind: "card", data: r } as FeedItem));

  const customItems: FeedItem[] = ((customData ?? []) as unknown[])
    .filter((r) => {
      const row = r as { title: string; price: number | null };
      if (searchQuery && !row.title?.toLowerCase().includes(searchQuery)) return false;
      if (minPrice !== null && (row.price === null || row.price < minPrice)) return false;
      if (maxPrice !== null && (row.price === null || row.price > maxPrice)) return false;
      return true;
    })
    .map((r) => ({ kind: "custom", data: r } as FeedItem));

  const allRegular = sortFeed([...cardItems, ...customItems], sort);

  const featuredItems: FeedItem[] = ((featuredCards ?? []) as unknown[]).map(
    (r) => ({ kind: "card", data: r } as FeedItem)
  );

  const totalRegular = allRegular.length;
  const totalPages = Math.ceil(totalRegular / PAGE_SIZE);
  const pageSlice = allRegular.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const feed = buildFeed(pageSlice, featuredItems);
  const hasFilters = !!(listingType || conditionType || productType || searchQuery || minPrice || maxPrice || (sort && sort !== "newest"));

  const urlParams = { type: listingType, condition: conditionType, product: productType, q: searchQuery || null, sort: sort !== "newest" ? sort : null, min: min || null, max: max || null };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Browse listings</h1>
          <Link
            href="/listings/new"
            className="text-sm bg-black text-white px-4 py-2 font-bold hover:bg-zinc-800 transition-colors"
          >
            + New listing
          </Link>
        </div>

        <BrowseRealtimeRefresher />

        <div className="mb-5">
          <Suspense>
            <BrowseFilters />
          </Suspense>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-20 border-2 border-black">
            <p className="text-black font-bold mb-2">No listings found</p>
            {hasFilters ? (
              <p className="text-sm text-gray-500">Try removing some filters.</p>
            ) : (
              <p className="text-sm text-gray-500">Be the first to post a listing.</p>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
              {totalRegular} listing{totalRegular !== 1 ? "s" : ""}
              {hasFilters ? " — filtered" : ""}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {feed.map((item, idx) => (
                <>
                  <ListingCard key={`${item.kind}-${item.data.id}`} item={item} />
                  {/* Ad slot — reserved, not yet monetized */}
                  {idx === 5 && <div key="ad-1" />}
                  {idx === 17 && <div key="ad-2" />}
                </>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                {page > 0 && (
                  <PaginationLink href={buildPageUrl(page - 1, urlParams)} label="← Prev" />
                )}
                <span className="text-sm font-bold text-black">
                  {page + 1} / {totalPages}
                </span>
                {page < totalPages - 1 && (
                  <PaginationLink href={buildPageUrl(page + 1, urlParams)} label="Next →" />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
