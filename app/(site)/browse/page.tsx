import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import BrowseFilters from "./BrowseFilters";
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
  product: string | null
) {
  const p = new URLSearchParams();
  if (type) p.set("type", type);
  if (condition) p.set("condition", condition);
  if (product) p.set("product", product);
  if (page > 0) p.set("page", String(page));
  const qs = p.toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

function PaginationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm text-blue-600 hover:underline font-medium">
      {label}
    </Link>
  );
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; condition?: string; product?: string; page?: string }>;
}) {
  const { type, condition, product, page: pageStr } = await searchParams;
  const page = Math.max(0, parseInt(pageStr ?? "0") || 0);

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
    .filter((r) =>
      productType
        ? (r as { card: { product_type: string } }).card?.product_type === productType
        : true
    )
    .map((r) => ({ kind: "card", data: r } as FeedItem));

  const customItems: FeedItem[] = ((customData ?? []) as unknown[]).map(
    (r) => ({ kind: "custom", data: r } as FeedItem)
  );

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
  const hasFilters = !!(listingType || conditionType || productType);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-black">Browse listings</h1>
          <Link
            href="/listings/new"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New listing
          </Link>
        </div>

        <div className="mb-5">
          <Suspense>
            <BrowseFilters />
          </Suspense>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-black mb-2 font-medium">No listings found</p>
            {hasFilters && (
              <p className="text-sm text-gray-500">Try removing some filters.</p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {totalRegular} listing{totalRegular !== 1 ? "s" : ""}
              {hasFilters ? " matching your filters" : ""}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
              <div className="mt-8 flex items-center justify-center gap-3">
                {page > 0 && (
                  <PaginationLink
                    href={buildPageUrl(page - 1, listingType, conditionType, productType)}
                    label="← Previous"
                  />
                )}
                <span className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </span>
                {page < totalPages - 1 && (
                  <PaginationLink
                    href={buildPageUrl(page + 1, listingType, conditionType, productType)}
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
