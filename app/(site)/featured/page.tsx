import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ListingCard, { type FeedItem } from "@/app/(site)/browse/ListingCard";

const CARD_SELECT =
  "id, listing_type, condition_type, raw_condition, sealed_condition, " +
  "grading_company, grade, price_type, price, is_featured, created_at, " +
  "card:cards(name, set_name, card_number, image_url, product_type)";

export default async function FeaturedPage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: featuredListings } = await supabase
    .from("listings")
    .select(CARD_SELECT)
    .eq("status", "active")
    .eq("is_featured", true)
    .or(`featured_until.is.null,featured_until.gt.${now}`)
    .order("created_at", { ascending: false });

  const items: FeedItem[] = ((featuredListings ?? []) as unknown[]).map(
    (r) => ({ kind: "card", data: r } as FeedItem)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-500 text-lg">✦</span>
            <h1 className="text-2xl font-bold text-black">Featured listings</h1>
          </div>
          <p className="text-sm text-gray-500">
            These listings are highlighted by their sellers.{" "}
            <Link href="/feature-your-listing" className="text-blue-600 hover:underline">
              Feature your own listing →
            </Link>
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <p className="text-black font-medium mb-1">No featured listings right now</p>
            <p className="text-sm text-gray-500 mb-4">Be the first to get your listing seen by more collectors.</p>
            <Link
              href="/feature-your-listing"
              className="inline-block text-sm bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Feature your listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => (
              <ListingCard key={item.data.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
