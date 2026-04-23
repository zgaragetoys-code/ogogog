import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import {
  PRODUCT_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITION_LABELS,
  type Listing,
  type RawCondition,
  type SealedCondition,
} from "@/types/database";

type ListingRow = Listing & {
  card: { name: string; set_name: string; card_number: string; image_url: string | null; product_type: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-black text-white",
  pending:   "border-2 border-black text-black",
  sold:      "bg-gray-200 text-gray-700",
  cancelled: "bg-gray-200 text-gray-700",
};

function conditionSummary(listing: ListingRow): string {
  if (!listing.condition_type && !listing.condition_generic) return "Any condition";
  if (listing.condition_type === "raw" && listing.raw_condition)
    return RAW_CONDITION_LABELS[listing.raw_condition as RawCondition];
  if (listing.condition_type === "graded" && listing.grading_company)
    return `${listing.grading_company} ${listing.grade ?? "any grade"}`;
  if (listing.condition_type === "sealed" && listing.sealed_condition)
    return SEALED_CONDITION_LABELS[listing.sealed_condition as SealedCondition];
  if (listing.condition_generic)
    return GENERIC_CONDITION_LABELS[listing.condition_generic];
  return "—";
}

function PriceDisplay({ priceType, price }: { priceType: string; price: number | null }) {
  return (
    <p className="font-black text-black">
      {priceType === "open_to_offers" ? "Make offer" : `$${Number(price).toFixed(2)}`}
      {priceType === "obo" && <span className="ml-1 text-xs font-bold border border-black px-1">OBO</span>}
    </p>
  );
}

function ListingRow({ listing }: { listing: ListingRow }) {
  const isCard = !!listing.card;
  const name = isCard ? (listing.card?.name ?? "Unknown") : (listing.title ?? "Untitled");
  const imageUrl = listing.listing_image_url ?? listing.card?.image_url ?? null;

  return (
    <Link href={`/listings/${listing.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      {imageUrl ? (
        <SafeImage
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-12 h-auto shrink-0 object-contain max-h-16"
          fallback={
            <div className="w-12 h-16 bg-gray-200 shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          }
        />
      ) : (
        <div className="w-12 h-16 bg-gray-200 shrink-0 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-black truncate">{name}</p>
        {isCard ? (
          <p className="text-xs text-gray-700">
            {listing.card?.set_name} · #{listing.card?.card_number} · {PRODUCT_TYPE_LABELS[listing.card?.product_type as keyof typeof PRODUCT_TYPE_LABELS]}
          </p>
        ) : listing.custom_category ? (
          <p className="text-xs text-gray-700">{CUSTOM_CATEGORY_LABELS[listing.custom_category]}</p>
        ) : null}
        <p className="text-xs text-gray-700">{conditionSummary(listing)}</p>
        {(listing.set_year || listing.set_series) && (
          <p className="text-xs text-gray-700">
            {[listing.set_year, listing.set_series].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <div className="text-right shrink-0 space-y-1">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
        <span className={`inline-block text-xs font-bold px-2 py-0.5 uppercase tracking-wide ${STATUS_STYLES[listing.status] ?? "bg-gray-200 text-gray-700"}`}>
          {listing.status}
        </span>
      </div>
    </Link>
  );
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/listings/mine");

  const { created } = await searchParams;

  const { data: listingsData } = await supabase
    .from("listings")
    .select("*, card:cards!card_id(name, set_name, card_number, image_url, product_type)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (listingsData ?? []) as unknown as ListingRow[];

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

        {listings.length === 0 ? (
          <div className="text-center py-16 border-2 border-black">
            <p className="text-black font-bold mb-5">No listings yet.</p>
            <Link href="/listings/new" className="text-sm bg-black text-white px-5 py-2.5 font-bold hover:bg-zinc-800 transition-colors">
              Create your first listing
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">
              {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </p>
            <div className="divide-y-2 divide-black border-t-2 border-b-2 border-black">
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
