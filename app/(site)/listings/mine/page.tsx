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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/listings/mine");

  const { created } = await searchParams;

  const [{ data: cardData }, { data: customData }] = await Promise.all([
    supabase.from("listings").select("*, card:cards(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("custom_listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const cardListings = (cardData ?? []) as unknown as ListingWithCard[];
  const customListings = (customData ?? []) as unknown as CustomListing[];

  const all: AnyListing[] = [
    ...cardListings.map(d => ({ kind: "card" as const, data: d })),
    ...customListings.map(d => ({ kind: "custom" as const, data: d })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-8">
        {created === "1" && (
          <div className="mb-6 px-4 py-3 bg-black text-white text-sm font-bold border-2 border-black">
            Listing created.
          </div>
        )}

        <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">My listings</h1>
          <Link href="/listings/new" className="text-sm bg-black text-white px-4 py-2 font-bold hover:bg-zinc-800 transition-colors">
            + New listing
          </Link>
        </div>

        {all.length === 0 ? (
          <div className="text-center py-16 border-2 border-black">
            <p className="text-black font-bold mb-5">No listings yet.</p>
            <Link href="/listings/new" className="text-sm bg-black text-white px-5 py-2.5 font-bold hover:bg-zinc-800 transition-colors">
              Create your first listing
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
              {all.length} listing{all.length !== 1 ? "s" : ""}
            </p>
            <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
              {all.map(item =>
                item.kind === "card"
                  ? <CardListingRow key={`card-${item.data.id}`} listing={item.data} />
                  : <CustomListingRow key={`custom-${item.data.id}`} listing={item.data} />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function cardConditionSummary(listing: ListingWithCard): string {
  if (listing.condition_type === "raw" && listing.raw_condition) return RAW_CONDITION_LABELS[listing.raw_condition];
  if (listing.condition_type === "graded" && listing.grading_company) return `${listing.grading_company} ${listing.grade}`;
  if (listing.condition_type === "sealed" && listing.sealed_condition) return SEALED_CONDITION_LABELS[listing.sealed_condition];
  return "—";
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-black text-white",
  pending:   "border-2 border-black text-black",
  sold:      "bg-gray-200 text-gray-600",
  cancelled: "bg-gray-200 text-gray-600",
};

function PriceDisplay({ priceType, price }: { priceType: string; price: number | null }) {
  return (
    <p className="font-black text-black">
      {priceType === "open_to_offers" ? "Make offer" : `$${Number(price).toFixed(2)}`}
      {priceType === "obo" && <span className="ml-1 text-xs font-bold border border-black px-1">OBO</span>}
    </p>
  );
}

function CardListingRow({ listing }: { listing: ListingWithCard }) {
  const { card } = listing;
  return (
    <Link href={`/listings/${listing.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      {card.image_url ? (
        <img src={card.image_url} alt={card.name} referrerPolicy="no-referrer" className="w-12 h-auto shrink-0" />
      ) : (
        <div className="w-12 h-16 bg-gray-200 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-black truncate">{card.name}</p>
        <p className="text-xs text-gray-500">{card.set_name} · #{card.card_number} · {PRODUCT_TYPE_LABELS[card.product_type]}</p>
        <p className="text-xs text-gray-500">{cardConditionSummary(listing)}</p>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
        <span className={`inline-block text-xs font-bold px-2 py-0.5 uppercase tracking-wide ${STATUS_STYLES[listing.status] ?? "bg-gray-200 text-gray-600"}`}>
          {listing.status}
        </span>
      </div>
    </Link>
  );
}

function CustomListingRow({ listing }: { listing: CustomListing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      <div className="w-12 h-16 bg-gray-200 shrink-0 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-black truncate">{listing.title}</p>
          <span className="text-[10px] font-black border border-black px-1.5 py-0.5 uppercase shrink-0">Custom</span>
        </div>
        <p className="text-xs text-gray-500">{CUSTOM_CATEGORY_LABELS[listing.custom_category]} · {GENERIC_CONDITION_LABELS[listing.condition_generic]}</p>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
        <span className={`inline-block text-xs font-bold px-2 py-0.5 uppercase tracking-wide ${STATUS_STYLES[listing.status] ?? "bg-gray-200 text-gray-600"}`}>
          {listing.status}
        </span>
      </div>
    </Link>
  );
}
