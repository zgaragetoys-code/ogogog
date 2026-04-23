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
  type: string | null,
  condition: string | null,
  product: string | null,
  q: string
) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (type) p.set("type", type);
  if (condition) p.set("condition", condition);
  if (product) p.set("product", product);
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
  searchParams: Promise<{ type?: string; condition?: string; product?: string; page?: string; q?: string }>;
}) {
  const { type, condition, product, page: pageStr, q } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0") || 0);
  const searchQuery = q?.trim().toLowerCase() ?? "";

  const listingType = (type as ListingType) || null;
  const conditionType = (condition as ConditionType) || null;
  const productType = (product as ProductType) || null;

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Featured card listings — shown on every page
  const { data: featuredCards } = await supabase
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("is_featured", true)
    .or(`featured_until.is.null,featured_until.gt.${now}`)
    .order("created_at", { ascending: false });

  // Regular card listings
  let cardQuery = supabase
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("is_featured", false)
    .order("created_at", { ascending: false })
    .limit(500);

  if (listingType) cardQuery = cardQuery.eq("listing_type", listingType);
  if (conditionType) cardQuery = cardQuery.eq("condition_type", conditionType);

  // Custom listings — excluded when condition or product filters are active
  let customQuery = supabase
    .from("custom_listings")
    .select(CUSTOM_SELECT)
    .eq("status", "active")
    .eq("is_featured", false)
    .order("created_at", { ascending: false })
    .limit(500);

  if (listingType) customQuery = customQuery.eq("listing_type", listingType);

  const [{ data: cardData }, { data: customData }] = await Promise.all([
    cardQuery,
    conditionType || productType ? Promise.resolve({ data: [] }) : customQuery,
  ]);

  // Filter by product type client-side (lives on joined cards table)
  const cardItems: FeedItem[] = ((cardData ?? []) as unknown[])
    .filter((r) => {
      const row = r as { card: { product_type: string; name: string } };
      if (productType && row.card?.product_type !== productType) return false;
      if (searchQuery && !row.card?.name?.toLowerCase().includes(searchQuery)) return false;
      return true;
    })
    .map((r) => ({ kind: "card", data: r } as FeedItem));

  const customItems: FeedItem[] = ((customData ?? []) as unknown[])
    .filter((r) => {
      if (searchQuery) {
        const row = r as { title: string };
        return row.title?.toLowerCase().includes(searchQuery);
      }
      return true;
    })
    .map((r) => ({ kind: "custom", data: r } as FeedItem));

  const allRegular: FeedItem[] = [...cardItems, ...customItems].sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
  );

  const featuredItems: FeedItem[] = ((featuredCards ?? []) as unknown[]).map(
    (r) => ({ kind: "card", data: r } as FeedItem)
  );

  const totalRegular = allRegular.length;
  const totalPages = Math.ceil(totalRegular / PAGE_SIZE);
  const pageSlice = allRegular.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const feed = buildFeed(pageSlice, featuredItems);
  const hasFilters = !!(listingType || conditionType || productType || searchQuery);

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
            {hasFilters && (
              <p className="text-sm text-gray-500">Try removing some filters.</p>
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
                  <PaginationLink
                    href={buildPageUrl(page - 1, listingType, conditionType, productType, searchQuery)}
                    label="← Prev"
                  />
                )}
                <span className="text-sm font-bold text-black">
                  {page + 1} / {totalPages}
                </span>
                {page < totalPages - 1 && (
                  <PaginationLink
                    href={buildPageUrl(page + 1, listingType, conditionType, productType, searchQuery)}
                    label="Next →"
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
