import Link from "next/link";
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

type CardFeedData = {
  id: string;
  listing_type: ListingType;
  condition_type: ConditionType | null;
  raw_condition: RawCondition | null;
  sealed_condition: SealedCondition | null;
  grading_company: GradingCompany | null;
  grade: number | null;
  price_type: PriceType;
  price: number | null;
  is_featured: boolean;
  created_at: string;
  card: {
    name: string;
    set_name: string;
    card_number: string;
    image_url: string | null;
    product_type: ProductType;
  };
};

type CustomFeedData = {
  id: string;
  title: string;
  custom_category: CustomCategory;
  condition_generic: GenericCondition;
  listing_type: ListingType;
  price_type: PriceType;
  price: number | null;
  is_featured: boolean;
  created_at: string;
};

export type FeedItem =
  | { kind: "card"; data: CardFeedData }
  | { kind: "custom"; data: CustomFeedData };

function conditionLabel(data: CardFeedData): string {
  if (data.condition_type === "raw" && data.raw_condition) {
    return RAW_CONDITION_LABELS[data.raw_condition];
  }
  if (data.condition_type === "graded" && data.grading_company) {
    return `${data.grading_company} ${data.grade}`;
  }
  if (data.condition_type === "sealed" && data.sealed_condition) {
    return SEALED_CONDITION_LABELS[data.sealed_condition];
  }
  return "—";
}

function PriceTag({ priceType, price }: { priceType: PriceType; price: number | null }) {
  if (priceType === "open_to_offers") {
    return <span className="text-sm font-semibold text-black">Make offer</span>;
  }
  return (
    <span className="text-sm font-semibold text-black">
      ${Number(price).toFixed(2)}
      {priceType === "obo" && (
        <span className="ml-1 text-xs text-gray-500 font-normal border border-gray-300 rounded px-1 py-0.5">
          OBO
        </span>
      )}
    </span>
  );
}

function TypeBadge({ type }: { type: ListingType }) {
  return type === "for_sale" ? (
    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
      For Sale
    </span>
  ) : (
    <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
      Wanted
    </span>
  );
}

export default function ListingCard({ item }: { item: FeedItem }) {
  if (item.kind === "card") {
    const { data } = item;
    return (
      <Link href={`/listings/${data.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col relative hover:shadow-md transition-shadow">
        {data.is_featured && (
          <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-0.5 tracking-wide">
            ✦ Featured
          </div>
        )}
        <div className="bg-gray-50 flex items-center justify-center p-3 h-40">
          {data.card.image_url ? (
            <img
              src={data.card.image_url}
              alt={data.card.name}
              referrerPolicy="no-referrer"
              className="h-full w-auto object-contain"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-200 rounded" />
          )}
        </div>
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="text-sm font-semibold text-black leading-tight line-clamp-2">
            {data.card.name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {data.card.set_name} · #{data.card.card_number}
          </p>
          <p className="text-xs text-gray-500">
            {PRODUCT_TYPE_LABELS[data.card.product_type]}
          </p>
          <p className="text-xs text-black">{conditionLabel(data)}</p>
          <div className="mt-auto pt-2 flex items-center justify-between gap-1 flex-wrap">
            <PriceTag priceType={data.price_type} price={data.price} />
            <TypeBadge type={data.listing_type} />
          </div>
        </div>
      </Link>
    );
  }

  const { data } = item;
  return (
    <Link href={`/listings/${data.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col relative hover:shadow-md transition-shadow">
      {data.is_featured && (
        <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-0.5 tracking-wide">
          ✦ Featured
        </div>
      )}
      <div className="bg-gray-50 flex items-center justify-center p-3 h-40">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-xs">Custom</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-sm font-semibold text-black leading-tight line-clamp-2">
          {data.title}
        </p>
        <p className="text-xs text-gray-500">
          {CUSTOM_CATEGORY_LABELS[data.custom_category]}
        </p>
        <p className="text-xs text-black">
          {GENERIC_CONDITION_LABELS[data.condition_generic]}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between gap-1 flex-wrap">
          <PriceTag priceType={data.price_type} price={data.price} />
          <TypeBadge type={data.listing_type} />
        </div>
      </div>
    </Link>
  );
}
