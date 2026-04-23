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
  if (data.condition_type === "raw" && data.raw_condition)
    return RAW_CONDITION_LABELS[data.raw_condition];
  if (data.condition_type === "graded" && data.grading_company)
    return `${data.grading_company} ${data.grade}`;
  if (data.condition_type === "sealed" && data.sealed_condition)
    return SEALED_CONDITION_LABELS[data.sealed_condition];
  return "—";
}

function PriceTag({ priceType, price }: { priceType: PriceType; price: number | null }) {
  if (priceType === "open_to_offers")
    return <span className="text-sm font-black text-black">Make offer</span>;
  return (
    <span className="text-sm font-black text-black">
      ${Number(price).toFixed(2)}
      {priceType === "obo" && (
        <span className="ml-1 text-xs font-bold border border-black px-1 py-0.5 align-middle">
          OBO
        </span>
      )}
    </span>
  );
}

function TypeBadge({ type }: { type: ListingType }) {
  return type === "for_sale" ? (
    <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 uppercase tracking-wide">
      For Sale
    </span>
  ) : (
    <span className="text-[10px] font-black border-2 border-black text-black px-1.5 py-0.5 uppercase tracking-wide">
      Wanted
    </span>
  );
}

export default function ListingCard({ item }: { item: FeedItem }) {
  if (item.kind === "card") {
    const { data } = item;
    return (
      <Link
        href={`/listings/${data.id}`}
        className={`bg-white border-2 overflow-hidden flex flex-col relative hover:shadow-[4px_4px_0px_0px_#000] transition-shadow ${
          data.is_featured ? "border-yellow-400" : "border-black"
        }`}
      >
        {data.is_featured && (
          <div className="bg-yellow-400 text-black text-[10px] font-black text-center py-0.5 tracking-widest uppercase">
            ✦ Featured
          </div>
        )}
        <div className="bg-gray-100 flex items-center justify-center p-3 h-40">
          {data.card.image_url ? (
            <img
              src={data.card.image_url}
              alt={data.card.name}
              referrerPolicy="no-referrer"
              className="h-full w-auto object-contain"
            />
          ) : (
            <div className="w-20 h-28 bg-gray-300" />
          )}
        </div>
        <div className="p-2.5 flex flex-col gap-1 flex-1 border-t-2 border-black">
          <p className="text-xs font-bold text-black leading-tight line-clamp-2">
            {data.card.name}
          </p>
          <p className="text-[10px] text-gray-500 truncate">
            {data.card.set_name} · #{data.card.card_number}
          </p>
          <p className="text-[10px] text-gray-500">{conditionLabel(data)}</p>
          <div className="mt-auto pt-1.5 flex items-center justify-between gap-1 flex-wrap">
            <PriceTag priceType={data.price_type} price={data.price} />
            <TypeBadge type={data.listing_type} />
          </div>
        </div>
      </Link>
    );
  }

  const { data } = item;
  return (
    <Link
      href={`/listings/${data.id}`}
      className={`bg-white border-2 overflow-hidden flex flex-col relative hover:shadow-[4px_4px_0px_0px_#000] transition-shadow ${
        data.is_featured ? "border-yellow-400" : "border-black"
      }`}
    >
      {data.is_featured && (
        <div className="bg-yellow-400 text-black text-[10px] font-black text-center py-0.5 tracking-widest uppercase">
          ✦ Featured
        </div>
      )}
      <div className="bg-gray-100 flex items-center justify-center p-3 h-40">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wide">Custom</span>
        </div>
      </div>
      <div className="p-2.5 flex flex-col gap-1 flex-1 border-t-2 border-black">
        <p className="text-xs font-bold text-black leading-tight line-clamp-2">{data.title}</p>
        <p className="text-[10px] text-gray-500">{CUSTOM_CATEGORY_LABELS[data.custom_category]}</p>
        <p className="text-[10px] text-gray-500">{GENERIC_CONDITION_LABELS[data.condition_generic]}</p>
        <div className="mt-auto pt-1.5 flex items-center justify-between gap-1 flex-wrap">
          <PriceTag priceType={data.price_type} price={data.price} />
          <TypeBadge type={data.listing_type} />
        </div>
      </div>
    </Link>
  );
}
