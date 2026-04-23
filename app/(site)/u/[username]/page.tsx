import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { avatarUrl } from "@/lib/avatar";
import { COUNTRIES } from "@/data/countries";
import { PRODUCT_TYPE_LABELS, RAW_CONDITION_LABELS, SEALED_CONDITION_LABELS,
  CUSTOM_CATEGORY_LABELS, GENERIC_CONDITION_LABELS,
  type Profile, type AvatarStyle, type ListingWithCard, type CustomListing } from "@/types/database";
import CopyProfileUrl from "./CopyProfileUrl";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profileData) notFound();
  const profile = profileData as Profile;

  const [{ data: cardData }, { data: customData }, { data: collectionData }] = await Promise.all([
    supabase
      .from("listings")
      .select("*, card:cards(*)")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("custom_listings")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("collection_items")
      .select("id, quantity, for_sale, card:cards(name, set_name, card_number, image_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const cardListings = (cardData ?? []) as unknown as ListingWithCard[];
  const customListings = (customData ?? []) as unknown as CustomListing[];

  type CollectionCard = {
    id: string;
    quantity: number;
    for_sale: boolean;
    card: { name: string; set_name: string; card_number: string; image_url: string | null };
  };
  const collectionItems = (collectionData ?? []) as unknown as CollectionCard[];

  const allListings = [
    ...cardListings.map(d => ({ kind: "card" as const, data: d })),
    ...customListings.map(d => ({ kind: "custom" as const, data: d })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());

  const seed = profile.avatar_seed ?? profile.id;
  const style = (profile.avatar_style ?? "identicon") as AvatarStyle;
  const displayName = profile.display_name ?? profile.username ?? "Anonymous";

  const location = [
    profile.region,
    profile.country ? COUNTRIES.find(c => c.code === profile.country)?.name : null,
  ].filter(Boolean).join(", ");

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  const socialLinks = [
    profile.tcgplayer_url   && { href: profile.tcgplayer_url,   label: "TCGplayer" },
    profile.ebay_username   && { href: `https://www.ebay.com/usr/${profile.ebay_username}`, label: `eBay: ${profile.ebay_username}` },
    profile.facebook_url    && { href: profile.facebook_url,    label: "Facebook" },
    profile.instagram_url   && { href: profile.instagram_url,   label: "Instagram" },
    profile.discord_username && { href: "#", label: `Discord: ${profile.discord_username}` },
    profile.website_url     && { href: profile.website_url,     label: "Website" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Identity card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-5">
          <img
            src={avatarUrl(style, seed)}
            alt={displayName}
            className="w-20 h-20 rounded-full shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-black truncate">{displayName}</h1>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            {location && <p className="text-sm text-black mt-1">{location}</p>}
            <p className="text-xs text-gray-500 mt-1">Member since {memberSince}</p>
          </div>
          <CopyProfileUrl username={profile.username!} />
        </div>

        {/* Collectr embed */}
        {profile.collectr_url && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-black">{displayName}&apos;s Collectr collection</p>
              <a
                href={profile.collectr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                Open in Collectr
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <iframe
              src={profile.collectr_url}
              className="w-full border-0"
              style={{ height: 560 }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Collectr collection"
            />
          </div>
        )}

        {/* ogogog collection */}
        {collectionItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-black">
                Collection
                <span className="text-sm font-normal text-gray-500 ml-2">{collectionItems.length} cards</span>
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {collectionItems.map(item => (
                <div key={item.id} className="relative group">
                  {item.card.image_url ? (
                    <img
                      src={item.card.image_url}
                      alt={item.card.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-gray-100 rounded-lg" />
                  )}
                  {item.quantity > 1 && (
                    <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ×{item.quantity}
                    </span>
                  )}
                  {item.for_sale && (
                    <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      FS
                    </span>
                  )}
                  <div className="hidden group-hover:block absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] p-1 rounded-b-lg leading-tight">
                    {item.card.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {profile.notes && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-black mb-2">About</h2>
            <p className="text-sm text-black whitespace-pre-wrap">{profile.notes}</p>
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-black mb-3">Links</h2>
            <div className="space-y-2">
              {socialLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  {l.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Active listings */}
        <div>
          <h2 className="text-lg font-bold text-black mb-3">
            Active listings
            {allListings.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">{allListings.length}</span>
            )}
          </h2>

          {allListings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-black">No active listings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allListings.map((item) =>
                item.kind === "card" ? (
                  <CardListingRow key={`card-${item.data.id}`} listing={item.data} />
                ) : (
                  <CustomListingRow key={`custom-${item.data.id}`} listing={item.data} />
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Listing row components (read-only, no edit controls) ──────────────────

function conditionSummary(listing: ListingWithCard): string {
  if (listing.condition_type === "raw" && listing.raw_condition)
    return RAW_CONDITION_LABELS[listing.raw_condition];
  if (listing.condition_type === "graded" && listing.grading_company)
    return `${listing.grading_company} ${listing.grade}`;
  if (listing.condition_type === "sealed" && listing.sealed_condition)
    return SEALED_CONDITION_LABELS[listing.sealed_condition];
  return "—";
}

function PriceDisplay({ priceType, price }: { priceType: string; price: number | null }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <p className="font-semibold text-black">
        {priceType === "open_to_offers" ? "Make an offer" : `$${Number(price).toFixed(2)}`}
      </p>
      {priceType === "obo" && (
        <span className="text-xs text-gray-500 border border-gray-300 rounded px-1 py-0.5 leading-none">OBO</span>
      )}
    </div>
  );
}

function CardListingRow({ listing }: { listing: ListingWithCard }) {
  const { card } = listing;
  return (
    <Link href={`/listings/${listing.id}`} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      {card.image_url ? (
        <img src={card.image_url} alt={card.name} referrerPolicy="no-referrer"
          className="w-12 h-auto rounded shrink-0" />
      ) : (
        <div className="w-12 h-16 bg-gray-100 rounded shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-black truncate">{card.name}</p>
        <p className="text-xs text-black">{card.set_name} · #{card.card_number} · {PRODUCT_TYPE_LABELS[card.product_type]}</p>
        <p className="text-xs text-black mt-0.5">{conditionSummary(listing)}</p>
      </div>
      <div className="text-right shrink-0">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
        <p className="text-xs text-black mt-0.5 capitalize">{listing.listing_type === "for_sale" ? "For sale" : "Wanted"}</p>
      </div>
    </Link>
  );
}

function CustomListingRow({ listing }: { listing: CustomListing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-12 h-16 bg-gray-100 rounded shrink-0 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-semibold text-black truncate">{listing.title}</p>
          <span className="text-xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">Custom</span>
        </div>
        <p className="text-xs text-black">
          {CUSTOM_CATEGORY_LABELS[listing.custom_category]} · {GENERIC_CONDITION_LABELS[listing.condition_generic]}
        </p>
      </div>
      <div className="text-right shrink-0">
        <PriceDisplay priceType={listing.price_type} price={listing.price} />
        <p className="text-xs text-black mt-0.5 capitalize">{listing.listing_type === "for_sale" ? "For sale" : "Wanted"}</p>
      </div>
    </Link>
  );
}
