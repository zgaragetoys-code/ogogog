import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import ListingCard, { type FeedListing } from "./browse/ListingCard";

const LISTING_SELECT =
  "id, listing_type, condition_type, raw_condition, sealed_condition, " +
  "grading_company, grade, condition_generic, price_type, price, " +
  "is_featured, created_at, set_year, set_series, " +
  "title, custom_category, listing_image_url, " +
  "card:cards!card_id(name, set_name, card_number, image_url, product_type, release_date)";

export const metadata: Metadata = {
  title: "ogogog — Pokemon TCG Marketplace for Collectors",
  description:
    "Buy, sell, and trade Pokemon TCG cards with zero fees. Post a listing in 2 minutes and deal directly with buyers over PayPal G&S.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: recentData } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  const listings = (recentData ?? []) as unknown as FeedListing[];

  let bookmarkedIds = new Set<string>();
  if (user) {
    const { data: bms } = await supabase
      .from("bookmarks")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("target_type", "listing");
    bookmarkedIds = new Set((bms ?? []).map((b) => b.target_id));
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b-2 border-black px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
            Pokemon TCG Marketplace
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-black leading-tight mb-6">
            Built for collectors,
            <br className="hidden sm:block" /> not corporations.
          </h1>
          <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto leading-relaxed">
            No fees. No algorithms. Post a listing in 2 minutes and deal
            directly with buyers over PayPal G&amp;S.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="bg-black text-white px-8 py-3 text-sm font-black hover:bg-zinc-800 transition-colors uppercase tracking-wide"
            >
              Browse listings
            </Link>
            <Link
              href={user ? "/listings/new" : "/auth/signup"}
              className="border-2 border-black text-black px-8 py-3 text-sm font-black hover:bg-black hover:text-white transition-colors uppercase tracking-wide"
            >
              {user ? "List a card" : "Sign up free"}
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <span>Zero seller fees</span>
            <span className="hidden sm:block text-gray-300">|</span>
            <span>Direct messaging</span>
            <span className="hidden sm:block text-gray-300">|</span>
            <span>23,000+ card catalog</span>
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-black">
          <h2 className="text-xs font-black uppercase tracking-widest text-black">
            Just listed
          </h2>
          <Link
            href="/browse"
            className="text-xs font-black uppercase tracking-widest text-black hover:underline"
          >
            See all →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="border-2 border-black p-12 text-center">
            <p className="text-sm text-gray-700">
              No listings yet — be the first!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                currentUserId={user?.id}
                isBookmarked={bookmarkedIds.has(item.id)}
              />
            ))}
          </div>
        )}

        {!user && (
          <div className="mt-12 border-2 border-black p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-black uppercase tracking-tight">
                Ready to sell or find cards?
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Create a free account. Post listings, message sellers, save finds.
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="bg-black text-white px-5 py-2.5 text-sm font-black hover:bg-zinc-800 transition-colors shrink-0"
            >
              Sign up free
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
