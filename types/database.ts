// ----------------------------------------------------------------
// Enum values — mirror the Postgres enums in 001_initial_schema.sql
// Use these arrays for dropdowns and server-side validation.
// The TypeScript types are inferred from the arrays so they never drift.
// ----------------------------------------------------------------

export const PRODUCT_TYPES = [
  "single_card",
  "booster_pack",
  "booster_box",
  "etb",
  "tin",
  "collection_box",
  "theme_deck",
  "starter_deck",
  "bundle",
  "promo_pack",
  "master_set",
  "other_sealed",
  "other",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

// Subset of product types that are sealed products.
// Used to validate that sealed_condition is only applied to sealed items.
export const SEALED_PRODUCT_TYPES = new Set<ProductType>([
  "booster_pack",
  "booster_box",
  "etb",
  "tin",
  "collection_box",
  "theme_deck",
  "starter_deck",
  "bundle",
  "promo_pack",
  "master_set",
  "other_sealed",
]);

export const LISTING_TYPES = ["for_sale", "wanted"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_STATUSES = [
  "active",
  "pending",
  "sold",
  "cancelled",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const CONDITION_TYPES = ["raw", "graded", "sealed"] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export const RAW_CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;
export type RawCondition = (typeof RAW_CONDITIONS)[number];

export const SEALED_CONDITIONS = [
  "factory_sealed",
  "sealed_no_outer_wrap",
  "opened_contents_sealed",
  "opened_partial",
  "damaged",
] as const;
export type SealedCondition = (typeof SEALED_CONDITIONS)[number];

export const GRADING_COMPANIES = ["PSA", "CGC", "BGS", "SGC"] as const;
export type GradingCompany = (typeof GRADING_COMPANIES)[number];

export const MASTER_SET_COMPLETIONS = [
  "100_percent",
  "near_complete",
  "partial",
] as const;
export type MasterSetCompletion = (typeof MASTER_SET_COMPLETIONS)[number];

// ----------------------------------------------------------------
// Grade options per grading company
// PSA + SGC: whole numbers only
// CGC + BGS: whole numbers and half grades
// ----------------------------------------------------------------

const WHOLE_GRADES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;
const HALF_GRADES = [
  10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1,
] as const;

export const GRADE_OPTIONS: Record<GradingCompany, readonly number[]> = {
  PSA: WHOLE_GRADES,
  SGC: WHOLE_GRADES,
  CGC: HALF_GRADES,
  BGS: HALF_GRADES,
};

// ----------------------------------------------------------------
// Display labels — used in dropdowns and listing detail views
// ----------------------------------------------------------------

export const RAW_CONDITION_LABELS: Record<RawCondition, string> = {
  NM: "Near Mint (NM)",
  LP: "Lightly Played (LP)",
  MP: "Moderately Played (MP)",
  HP: "Heavily Played (HP)",
  DMG: "Damaged (DMG)",
};

export const SEALED_CONDITION_LABELS: Record<SealedCondition, string> = {
  factory_sealed: "Factory Sealed",
  sealed_no_outer_wrap: "Sealed — No Outer Wrap",
  opened_contents_sealed: "Opened — Contents Sealed",
  opened_partial: "Opened — Partial Contents",
  damaged: "Damaged",
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  single_card: "Single Card",
  booster_pack: "Booster Pack",
  booster_box: "Booster Box",
  etb: "Elite Trainer Box (ETB)",
  tin: "Tin",
  collection_box: "Collection Box",
  theme_deck: "Theme Deck",
  starter_deck: "Starter Deck",
  bundle: "Bundle",
  promo_pack: "Promo Pack",
  master_set: "Master Set",
  other_sealed: "Other Sealed",
  other: "Other",
};

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  raw: "Raw",
  graded: "Graded",
  sealed: "Sealed",
};

// ----------------------------------------------------------------
// Database row types
// ----------------------------------------------------------------

export interface Card {
  id: string;
  name: string;
  set_name: string;
  set_code: string;
  card_number: string;
  rarity: string | null;
  image_url: string | null;
  release_date: string | null;
  language: string;
  product_type: ProductType;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  card_id: string;
  listing_type: ListingType;
  status: ListingStatus;
  condition_type: ConditionType | null;
  raw_condition: RawCondition | null;
  sealed_condition: SealedCondition | null;
  grading_company: GradingCompany | null;
  grade: number | null;
  price: number | null;
  notes: string | null;
  photo_links: string[];
  photo_notes: string | null;
  master_set_completion: MasterSetCompletion | null;
  master_set_included_cards: string | null;
  created_at: string;
  updated_at: string;
}

// Listing row joined with its card — used on feed and profile pages
export interface ListingWithCard extends Listing {
  card: Card;
}
