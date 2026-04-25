import Link from "next/link";
import CardThumb from "./CardThumb";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import {
  PRODUCT_TYPE_LABELS,
  RAW_CONDITION_LABELS,
  SEALED_CONDITION_LABELS,
  CUSTOM_CATEGORY_LABELS,
  GENERIC_CONDITION_LABELS,
  type ListingType,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
  type ProductType,
  type CustomCategory,
  type GenericCondition,
} from "@/types/database";

export type FeedListing = {
  id: string;
  listing_type: ListingType;
  price_type: PriceType;
  price: number | null;
  is_featured: boolean;
  created_at: string;
  set_year: number | null;
  set_series: string | null;
  // Catalog-linked
  card: {
    name: string;
    set_name: string;
    card_number: string;
    image_url: string | null;
    product_type: ProductType;
    release_date: string | null;
  } | null;
  // Custom item
  title: string | null;
  custom_category: CustomCategory | null;
  listing_image_url: string | null;
  // Condition
  condition_type: ConditionType | null;
  raw_condition: RawCondition | null;
  sealed_condition: SealedCondition | null;
  grading_company: GradingCompany | null;
  grade: number | null;
  condition_generic: GenericCondition | null;
};

function conditionLabel(item: FeedListing): string {
  if (!item.condition_type && !item.condition_generic) return "Any condition";
  if (item.condition_type === "raw" && item.raw_condition)
    return RAW_CONDITION_LABELS[item.raw_condition];
  if (item.condition_type === "graded" && item.grading_company)
    return `${item.grading_company} ${item.grade ?? "any grade"}`;
  if (item.condition_type === "sealed" && item.sealed_condition)
    return SEALED_CONDITION_LABELS[item.sealed_condition];
  if (item.condition_generic)
    return GENERIC_CONDITION_LABELS[item.condition_generic];
  return "—";
}

const CONDITION_COLORS: Record<string, string> = {
  NM: "text-green-700",
  LP: "text-yellow-700",
  MP: "text-orange-600",
  HP: "text-red-600",
  DMG: "text-red-800",
};

function conditionColor(item: FeedListing): string {
  if (item.raw_condition && CONDITION_COLORS[item.raw_condition])
    return CONDITION_COLORS[item.raw_condition];
  if (item.condition_type === "sealed") return "text-blue-700";
  if (item.condition_type === "graded") return "text-purple-700";
  return "text-gray-700";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PriceTag({ priceType, price }: { priceType: PriceType; price: number | null }) {
  if (priceType === "open_to_offers")
    return <span className="text-xs font-black text-black">Make offer</span>;
  if (price == null)
    return <span className="text-xs font-black text-black">—</span>;
  return (
    <span className="text-xs font-black text-black">
      ${Number(price).toFixed(2)}
      {priceType === "obo" && (
        <span className="ml-1 text-[9px] font-bold border border-black px-0.5 align-middle">OBO</span>
      )}
    </span>
  );
}

function TypeBadge({ type }: { type: ListingType }) {
  return type === "for_sale" ? (
    <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 uppercase tracking-wide">For Sale</span>
  ) : (
    <span className="text-[10px] font-black border-2 border-black text-black px-1.5 py-0.5 uppercase tracking-wide">Wanted</span>
  );
}

interface Props {
  item: FeedListing;
  currentUserId?: string;
  isBookmarked?: boolean;
}

export default function ListingCard({ item, currentUserId, isBookmarked }: Props) {
  const isCard = !!item.card;
  const name = isCard ? (item.card?.name ?? "Unknown") : (item.title ?? "Untitled");
  const sub = isCard
    ? `${item.card?.set_name ?? ""} · #${item.card?.card_number ?? ""}`
    : item.custom_category
      ? CUSTOM_CATEGORY_LABELS[item.custom_category]
      : null;
  const productLabel = isCard ? PRODUCT_TYPE_LABELS[item.card!.product_type] : null;
  const year = item.set_year ?? (item.card?.release_date ? new Date(item.card.release_date).getFullYear() : null);
  const imageUrl = item.listing_image_url ?? item.card?.image_url ?? null;

  return (
    <div className={`relative group bg-white border-2 overflow-hidden flex flex-col hover:shadow-[4px_4px_0px_0px_#000] transition-shadow ${
      item.is_featured ? "border-yellow-400" : "border-black"
    }`}>
      {/* Share + Bookmark buttons — top-right corner, visible on hover */}
      <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <ShareButton listingId={item.id} size="sm" />
        {currentUserId && (
          <BookmarkButton
            targetType="listing"
            targetId={item.id}
            initialBookmarked={isBookmarked ?? false}
            size="sm"
          />
        )}
      </div>

      <Link href={`/listings/${item.id}`} className="flex flex-col flex-1">
        {item.is_featured && (
          <div className="bg-yellow-400 text-black text-[10px] font-black text-center py-0.5 tracking-widest uppercase">
            ✦ Featured
          </div>
        )}

        <div className="relative w-full bg-white overflow-hidden" style={{ aspectRatio: "5/7" }}>
          {imageUrl ? (
            <CardThumb src={imageUrl} alt={name} cover />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300 bg-gray-50">
              <svg className="w-8 h-8 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        <div className="p-2 flex flex-col gap-0.5 flex-1 border-t-2 border-black">
          <p className="text-[11px] font-bold text-black leading-snug line-clamp-1">{name}</p>
          {sub && <p className="text-[10px] text-gray-700 truncate">{sub}</p>}
          <p className={`text-[10px] font-semibold ${conditionColor(item)}`}>{conditionLabel(item)}</p>
          <div className="mt-auto pt-1 flex items-center justify-between gap-1">
            <PriceTag priceType={item.price_type} price={item.price} />
            <TypeBadge type={item.listing_type} />
          </div>
        </div>
      </Link>
    </div>
  );
}
