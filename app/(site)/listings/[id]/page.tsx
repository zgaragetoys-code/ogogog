import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { avatarUrl } from "@/lib/avatar";
import { markAsSold } from "./actions";
import {
  PRODUCT_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITION_LABELS,
  type AvatarStyle,
  type ListingWithCard,
  type CustomListing,
} from "@/types/database";

// ── Helpers ────────────────────────────────────────────────────────────────

function isSafeUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url.split("?")[0]);
}

function domain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function conditionSummary(listing: ListingWithCard): string {
  if (listing.condition_type === "raw" && listing.raw_condition)
    return RAW_CONDITION_LABELS[listing.raw_condition];
  if (listing.condition_type === "graded" && listing.grading_company)
    return `${listing.grading_company} ${listing.grade}`;
  if (listing.condition_type === "sealed" && listing.sealed_condition)
    return SEALED_CONDITION_LABELS[listing.sealed_condition];
  return "—";
}

// ── Sub-components (server-safe) ───────────────────────────────────────────

function PriceBlock({ priceType, price, listingType }: {
  priceType: string; price: number | null; listingType: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-3xl font-black text-black">
        {priceType === "open_to_offers" ? "Make offer" : `$${Number(price).toFixed(2)}`}
      </span>
      {priceType === "obo" && (
        <span className="text-sm font-bold border-2 border-black px-1.5 py-0.5">OBO</span>
      )}
      {listingType === "for_sale" ? (
        <span className="text-xs font-black bg-black text-white px-2 py-0.5 uppercase tracking-wide">For Sale</span>
      ) : (
        <span className="text-xs font-black border-2 border-black text-black px-2 py-0.5 uppercase tracking-wide">Wanted</span>
      )}
    </div>
  );
}

function PhotoSection({ urls, notes }: { urls: string[]; notes: string | null }) {
  const safe = urls.filter(isSafeUrl);
  if (safe.length === 0) return null;
  const images = safe.filter(isImageUrl);
  const links = safe.filter((u) => !isImageUrl(u));

  return (
    <div className="border-2 border-black p-5">
      <h2 className="text-xs font-black uppercase tracking-widest text-black mb-3">Photos</h2>
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
              className="block aspect-square overflow-hidden border-2 border-black hover:opacity-90 transition-opacity">
              <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
      {links.map((url) => (
        <a key={url} href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-black hover:underline py-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {domain(url)} ↗
        </a>
      ))}
      {notes && <p className="text-xs text-gray-500 mt-2">{notes}</p>}
    </div>
  );
}

function SellerCard({
  profile,
  isOwner,
  ownerId,
  listingId,
  isCustom,
  listingStatus,
  currentUserId,
}: {
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_seed: string | null;
    avatar_style: AvatarStyle | null;
    country: string | null;
    region: string | null;
    created_at: string;
  } | null;
  isOwner: boolean;
  ownerId: string;
  listingId: string;
  isCustom: boolean;
  listingStatus: string;
  currentUserId: string | null;
}) {
  const seed = profile?.avatar_seed ?? listingId;
  const style = profile?.avatar_style ?? "identicon";
  const displayName = profile?.display_name ?? profile?.username ?? "Anonymous";
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const location = [profile?.region, profile?.country].filter(Boolean).join(", ");

  return (
    <div className="border-2 border-black p-5 space-y-4">
      <p className="text-xs font-black uppercase tracking-widest text-black">Seller</p>
      <div className="flex items-center gap-3">
        <img src={avatarUrl(style, seed)} alt={displayName} className="keep-round w-12 h-12 shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-black truncate">{displayName}</p>
          {profile?.username && <p className="text-xs text-gray-500">@{profile.username}</p>}
          {location && <p className="text-xs text-gray-500">{location}</p>}
          {memberSince && <p className="text-xs text-gray-400">Since {memberSince}</p>}
        </div>
      </div>

      {profile?.username && (
        <Link href={`/u/${profile.username}`} className="block text-sm font-bold text-black hover:underline">
          View profile →
        </Link>
      )}

      {isOwner ? (
        listingStatus === "active" && (
          <form action={markAsSold.bind(null, listingId, isCustom)}>
            <button type="submit" className="w-full py-2.5 border-2 border-black text-black text-sm font-bold hover:bg-black hover:text-white transition-colors">
              Mark as sold
            </button>
          </form>
        )
      ) : currentUserId ? (
        <Link href={`/messages/${listingId}/${ownerId}`} className="block w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors text-center">
          Message seller
        </Link>
      ) : (
        <Link href={`/auth/login?next=/messages/${listingId}/${ownerId}`} className="block w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors text-center">
          Sign in to message
        </Link>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cardListing }, { data: customListing }] = await Promise.all([
    supabase
      .from("listings")
      .select("*, card:cards(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("custom_listings")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!cardListing && !customListing) notFound();

  const isCustom = !cardListing;
  const listing = (cardListing ?? customListing) as ListingWithCard | CustomListing;
  const ownerId = listing.user_id;
  const isOwner = user?.id === ownerId;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_seed, avatar_style, country, region, created_at")
    .eq("id", ownerId)
    .maybeSingle();

  const isSold = listing.status === "sold";
  const isCancelled = listing.status === "cancelled";

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Back link */}
        <Link href="/browse" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black mb-5 inline-block">
          ← Browse
        </Link>

        {/* Sold / cancelled banner */}
        {(isSold || isCancelled) && (
          <div className="mb-5 px-4 py-3 bg-black text-white border-2 border-black text-sm font-bold uppercase tracking-wide">
            This listing is {isSold ? "sold" : "no longer active"}.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-2 border-black p-5">
              {isCustom ? (
                <CustomDetail listing={listing as CustomListing} />
              ) : (
                <CardDetail listing={cardListing as ListingWithCard} />
              )}
            </div>

            {listing.notes && (
              <div className="border-2 border-black p-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-black mb-2">Notes from seller</h2>
                <p className="text-sm text-black whitespace-pre-wrap">{listing.notes}</p>
              </div>
            )}

            <PhotoSection urls={listing.photo_links ?? []} notes={listing.photo_notes ?? null} />
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <SellerCard
              profile={profile}
              isOwner={isOwner}
              ownerId={ownerId}
              listingId={id}
              isCustom={isCustom}
              listingStatus={listing.status}
              currentUserId={user?.id ?? null}
            />
            <p className="text-xs text-gray-400 text-center">
              Listed {new Date(listing.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function CardDetail({ listing }: { listing: ListingWithCard }) {
  const { card } = listing;
  return (
    <div className="flex gap-5 items-start">
      <div className="shrink-0">
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} referrerPolicy="no-referrer" className="w-28 h-auto" />
        ) : (
          <div className="w-28 h-40 bg-gray-200" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h1 className="text-2xl font-black text-black leading-tight">{card.name}</h1>
        <p className="text-sm text-gray-500">
          {card.set_name} · #{card.card_number} · {PRODUCT_TYPE_LABELS[card.product_type]}
        </p>
        <p className="text-sm text-black">{conditionSummary(listing)}</p>
        <PriceBlock priceType={listing.price_type} price={listing.price} listingType={listing.listing_type} />
      </div>
    </div>
  );
}

function CustomDetail({ listing }: { listing: CustomListing }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <h1 className="text-xl font-bold text-black leading-tight flex-1">{listing.title}</h1>
        <span className="text-xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 shrink-0 mt-1">Custom</span>
      </div>
      <p className="text-sm text-gray-500">
        {CUSTOM_CATEGORY_LABELS[listing.custom_category]} · {GENERIC_CONDITION_LABELS[listing.condition_generic]}
      </p>
      {listing.description && (
        <p className="text-sm text-black whitespace-pre-wrap">{listing.description}</p>
      )}
      <PriceBlock priceType={listing.price_type} price={listing.price} listingType={listing.listing_type} />
    </div>
  );
}
