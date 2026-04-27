import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { avatarUrl } from "@/lib/avatar";
import { markAsSold, cancelListing } from "./actions";
import PhotoGrid from "./PhotoGrid";
import CardImage from "./CardImage";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import {
  PRODUCT_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITION_LABELS,
  type AvatarStyle,
  type Listing,
  type Card,
} from "@/types/database";

// ── Helpers ────────────────────────────────────────────────────────────────

function isSafeUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

type FullListing = Listing & { card?: Card | null };

function conditionSummary(listing: FullListing): string {
  if (listing.condition_type === "raw" && listing.raw_condition)
    return RAW_CONDITION_LABELS[listing.raw_condition];
  if (listing.condition_type === "graded" && listing.grading_company)
    return `${listing.grading_company} ${listing.grade ?? "any grade"}`;
  if (listing.condition_type === "sealed" && listing.sealed_condition)
    return SEALED_CONDITION_LABELS[listing.sealed_condition];
  if (listing.condition_generic)
    return GENERIC_CONDITION_LABELS[listing.condition_generic];
  return "Any condition";
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
  return <PhotoGrid urls={safe} notes={notes} />;
}

function ListingDetail({ listing }: { listing: FullListing }) {
  const isCard = !!listing.card;
  const name = isCard ? (listing.card?.name ?? "Unknown") : (listing.title ?? "Untitled");
  const imageUrl = listing.listing_image_url ?? listing.card?.image_url ?? null;

  return (
    <div className="flex gap-5 items-start">
      <div className="shrink-0">
        {imageUrl ? (
          <CardImage src={imageUrl} alt={name} />
        ) : (
          <div className="w-28 h-40 bg-gray-200" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h1 className="text-2xl font-black text-black leading-tight">{name}</h1>
        {isCard ? (
          <p className="text-sm text-gray-700">
            {listing.card?.set_name} · #{listing.card?.card_number} · {PRODUCT_TYPE_LABELS[listing.card?.product_type as keyof typeof PRODUCT_TYPE_LABELS]}
          </p>
        ) : listing.custom_category ? (
          <p className="text-sm text-gray-700">{CUSTOM_CATEGORY_LABELS[listing.custom_category]}</p>
        ) : null}
        {(listing.set_year || listing.set_series) && (
          <p className="text-xs text-gray-700">{[listing.set_year, listing.set_series].filter(Boolean).join(" · ")}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm text-black">{conditionSummary(listing)}</p>
          {listing.cert_number && (
            <a
              href={
                listing.grading_company === "PSA"
                  ? `https://www.psacard.com/cert/${listing.cert_number}`
                  : listing.grading_company === "CGC"
                  ? `https://www.cgccards.com/certlookup/${listing.cert_number}/`
                  : listing.grading_company === "BGS"
                  ? `https://www.beckett.com/grading/cert/${listing.cert_number}`
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-black bg-black text-white px-2 py-0.5 hover:bg-zinc-700 transition-colors"
              title="Verify cert number"
            >
              Cert #{listing.cert_number} ↗
            </a>
          )}
        </div>
        <PriceBlock priceType={listing.price_type} price={listing.price} listingType={listing.listing_type} />
      </div>
    </div>
  );
}

function SellerCard({
  profile,
  isOwner,
  ownerId,
  listingId,
  listingStatus,
  listingType,
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
  listingStatus: string;
  listingType: string;
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
          {profile?.username && <p className="text-xs text-gray-700">@{profile.username}</p>}
          {location && <p className="text-xs text-gray-700">{location}</p>}
          {memberSince && <p className="text-xs text-gray-700">Since {memberSince}</p>}
        </div>
      </div>

      {profile?.username && (
        <Link href={`/u/${profile.username}`} className="block text-sm font-bold text-black hover:underline">
          View profile →
        </Link>
      )}

      {isOwner ? (
        listingStatus === "active" && (
          <div className="space-y-2">
            <Link
              href={`/listings/${listingId}/edit`}
              className="block w-full py-2.5 border-2 border-black text-black text-sm font-bold hover:bg-black hover:text-white transition-colors text-center"
            >
              Edit listing
            </Link>
            <form action={markAsSold.bind(null, listingId)}>
              <button type="submit" className="w-full py-2.5 border-2 border-black text-black text-sm font-bold hover:bg-black hover:text-white transition-colors">
                Mark as sold
              </button>
            </form>
            <form action={cancelListing.bind(null, listingId)}>
              <button type="submit" className="w-full py-2.5 text-xs font-bold text-gray-700 hover:text-black transition-colors">
                Cancel listing
              </button>
            </form>
          </div>
        )
      ) : currentUserId ? (
        <Link href={`/messages/${listingId}/${ownerId}`} className="block w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors text-center">
          {listingType === "wanted" ? "Message buyer" : "Message seller"}
        </Link>
      ) : (
        <Link href={`/auth/login?next=/messages/${listingId}/${ownerId}`} className="block w-full py-2.5 bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors text-center">
          Sign in to message
        </Link>
      )}
    </div>
  );
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("listing_type, title, card:cards(name, set_name)")
    .eq("id", id)
    .maybeSingle();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ogogog-marketplace.com";
  const l = data as { listing_type: string; title: string | null; card?: { name: string; set_name: string } | null } | null;
  const title = l?.card?.name
    ? `${l.card.name} — ${l.listing_type === "for_sale" ? "For Sale" : "Wanted"} | ogogog`
    : l?.title
    ? `${l.title} | ogogog`
    : "Listing | ogogog";
  const description = l?.card?.name
    ? `${l.listing_type === "for_sale" ? "Buy" : "Find"} ${l.card.name}${l.card?.set_name ? ` from ${l.card.set_name}` : ""} on ogogog.`
    : "View this listing on ogogog Pokemon TCG Marketplace.";

  return {
    title,
    description,
    alternates: { canonical: `${base}/listings/${id}` },
    openGraph: { title, description, url: `${base}/listings/${id}`, siteName: "ogogog", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
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

  const { data: rawListing } = await supabase
    .from("listings")
    .select("*, card:cards(*)")
    .eq("id", id)
    .maybeSingle();

  if (!rawListing) notFound();

  const listing = rawListing as unknown as FullListing;
  const ownerId = listing.user_id;
  const isOwner = user?.id === ownerId;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_seed, avatar_style, country, region, created_at")
    .eq("id", ownerId)
    .maybeSingle();

  const isSold = listing.status === "sold";
  const isCancelled = listing.status === "cancelled";

  // Check bookmark status for logged-in users
  let isBookmarked = false;
  if (user) {
    const { data: bm } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", "listing")
      .eq("target_id", id)
      .maybeSingle();
    isBookmarked = !!bm;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Back link */}
        <Link href="/browse" className="text-xs font-bold uppercase tracking-widest text-gray-700 hover:text-black mb-5 inline-block">
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
              <ListingDetail listing={listing} />
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
              listingStatus={listing.status}
              listingType={listing.listing_type}
              currentUserId={user?.id ?? null}
            />
            {user && !isOwner ? (
              <div className="flex items-center justify-between border-2 border-black px-4 py-3">
                <span className="text-xs font-bold text-black uppercase tracking-wide">Save listing</span>
                <div className="flex items-center gap-2">
                  <ShareButton listingId={id} />
                  <BookmarkButton
                    targetType="listing"
                    targetId={id}
                    initialBookmarked={isBookmarked}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between border-2 border-black px-4 py-3">
                <span className="text-xs font-bold text-black uppercase tracking-wide">Share listing</span>
                <ShareButton listingId={id} />
              </div>
            )}
            <div className="flex items-center px-1">
              <p className="text-xs text-gray-700">
                Listed {new Date(listing.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
