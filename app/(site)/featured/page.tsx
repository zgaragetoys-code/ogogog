import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ListingCard, { type FeedListing } from "@/app/(site)/browse/ListingCard";

export default async function FeaturedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  let bookmarkedIds = new Set<string>();
  if (user) {
    const { data: bms } = await supabase
      .from("bookmarks")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("target_type", "listing");
    bookmarkedIds = new Set((bms ?? []).map((b) => b.target_id));
  }

  const LISTING_SELECT =
    "id, listing_type, condition_type, raw_condition, sealed_condition, " +
    "grading_company, grade, price_type, price, is_featured, created_at, " +
    "set_year, set_series, title, custom_category, listing_image_url, " +
    "condition_generic, card:cards!card_id(name, set_name, card_number, image_url, product_type, release_date)";

  const [{ data: featuredListings }, { data: recentData }] = await Promise.all([
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .eq("is_featured", true)
      .or(`featured_until.is.null,featured_until.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .eq("is_featured", false)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const items = ((featuredListings ?? []) as unknown as FeedListing[]);
  const recentItems = ((recentData ?? []) as unknown as FeedListing[]);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <span className="text-yellow-400">✦</span> Featured
            </h1>
            <p className="text-xs text-gray-700 mt-0.5">
              Highlighted listings.{" "}
              <Link href="/feature-your-listing" className="font-bold text-black hover:underline">
                Feature yours →
              </Link>
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <>
            <div className="border-2 border-black p-10 text-center mb-8">
              <p className="text-black font-bold mb-1">No featured listings right now</p>
              <p className="text-sm text-gray-700 mb-5">Be the first to get your listing seen by more collectors.</p>
              <Link href="/feature-your-listing" className="inline-block text-sm bg-black text-white px-5 py-2.5 font-bold hover:bg-zinc-800 transition-colors">
                Feature your listing
              </Link>
            </div>
            {recentItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
                  <h2 className="text-xs font-black uppercase tracking-widest text-black">Recent listings</h2>
                  <Link href="/browse" className="text-xs font-black uppercase tracking-widest text-black hover:underline">
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {recentItems.map((item) => (
                    <ListingCard key={item.id} item={item} currentUserId={user?.id} isBookmarked={bookmarkedIds.has(item.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} currentUserId={user?.id} isBookmarked={bookmarkedIds.has(item.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
