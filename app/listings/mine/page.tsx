import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PRODUCT_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  type ListingWithCard,
} from "@/types/database";

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/listings/mine");

  const { created } = await searchParams;

  const { data } = await supabase
    .from("listings")
    .select("*, card:cards(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (data ?? []) as unknown as ListingWithCard[];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-black">
            Pokemon TCG Marketplace
          </Link>
          <Link
            href="/listings/new"
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New listing
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {created === "1" && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium">
            Listing created successfully.
          </div>
        )}

        <h1 className="text-2xl font-bold text-black mb-2">My listings</h1>

        {listings.length === 0 ? (
          <div className="mt-6 text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-black mb-5">You haven&apos;t created any listings yet.</p>
            <Link
              href="/listings/new"
              className="text-sm bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-black mb-5">
              {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {listings.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function conditionSummary(listing: ListingWithCard): string {
  if (listing.condition_type === "raw" && listing.raw_condition) {
    return RAW_CONDITION_LABELS[listing.raw_condition];
  }
  if (listing.condition_type === "graded" && listing.grading_company) {
    return `${listing.grading_company} ${listing.grade}`;
  }
  if (listing.condition_type === "sealed" && listing.sealed_condition) {
    return SEALED_CONDITION_LABELS[listing.sealed_condition];
  }
  return "—";
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-800",
  pending:   "bg-yellow-100 text-yellow-800",
  sold:      "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
};

function ListingRow({ listing }: { listing: ListingWithCard }) {
  const { card } = listing;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      {card.image_url ? (
        <img
          src={card.image_url}
          alt={card.name}
          referrerPolicy="no-referrer"
          className="w-12 h-auto rounded shrink-0"
        />
      ) : (
        <div className="w-12 h-16 bg-gray-100 rounded shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black truncate">{card.name}</p>
        <p className="text-xs text-black">
          {card.set_name} · #{card.card_number} ·{" "}
          {PRODUCT_TYPE_LABELS[card.product_type]}
        </p>
        <p className="text-xs text-black mt-0.5">{conditionSummary(listing)}</p>
      </div>

      <div className="text-right shrink-0 space-y-1">
        <p className="font-semibold text-black">
          {listing.listing_type === "for_sale"
            ? listing.price != null
              ? `$${Number(listing.price).toFixed(2)}`
              : "Make an offer"
            : "Wanted"}
        </p>
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded-full ${
            STATUS_STYLES[listing.status] ?? "bg-gray-100 text-gray-500"
          }`}
        >
          {listing.status}
        </span>
      </div>
    </div>
  );
}
