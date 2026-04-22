import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PRODUCT_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITION_LABELS,
  type ListingWithCard,
  type CustomListing,
} from "@/types/database";

type AnyListing =
  | { kind: "card"; data: ListingWithCard }
  | { kind: "custom"; data: CustomListing };

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

  const [{ data: cardData }, { data: customData }] = await Promise.all([
    supabase
      .from("listings")
      .select("*, card:cards(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("custom_listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const cardListings = (cardData ?? []) as unknown as ListingWithCard[];
  const customListings = (customData ?? []) as unknown as CustomListing[];

  const all: AnyListing[] = [
    ...cardListings.map((d) => ({ kind: "card" as const, data: d })),
    ...customListings.map((d) => ({ kind: "custom" as const, data: d })),
  ].sort(
    (a, b) =>
      new Date(b.data.created_at).getTime() -
      new Date(a.data.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {created === "1" && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm font-medium">
            Listing created successfully.
          </div>
        )}

        <h1 className="text-2xl font-bold text-black mb-2">My listings</h1>

        {all.length === 0 ? (
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
              {all.length} listing{all.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {all.map((item) =>
                item.kind === "card" ? (
                  <CardListingRow key={`card-${item.data.id}`} listing={item.data} />
                ) : (
                  <CustomListingRow key={`custom-${item.data.id}`} listing={item.data} />
                )
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function cardConditionSummary(listing: ListingWithCard): string {
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

function PriceDisplay({ priceType, price }: { priceType: string; price: number | null }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <p className="font-semibold text-black">
        {priceType === "open_to_offers"
          ? "Make an offer"
          : `$${Number(price).toFixed(2)}`}
      </p>
      {priceType === "obo" && (
        <span className="text-xs text-gray-500 border border-gray-300 rounded px-1 py-0.5 leading-none">
          OBO
        </span>
      )}
    </div>
  );
}

function CardListingRow({ listing }: { listing: ListingWithCard }) {
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
        <p className="text-xs text-black mt-0.5">{cardConditionSummary(listing)}</p>
      </div>

      <div className="text-right shrink-0 space-y-1">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
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

function CustomListingRow({ listing }: { listing: CustomListing }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      {/* Category placeholder — no card image */}
      <div className="w-12 h-16 bg-gray-100 rounded shrink-0 flex items-center justify-center">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-semibold text-black truncate">{listing.title}</p>
          <span className="text-xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">
            Custom
          </span>
        </div>
        <p className="text-xs text-black">
          {CUSTOM_CATEGORY_LABELS[listing.custom_category]} ·{" "}
          {GENERIC_CONDITION_LABELS[listing.condition_generic]}
        </p>
      </div>

      <div className="text-right shrink-0 space-y-1">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
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
