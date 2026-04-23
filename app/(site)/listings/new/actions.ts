"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  LISTING_TYPES,
  CONDITION_TYPES,
  RAW_CONDITIONS,
  SEALED_CONDITIONS,
  GRADING_COMPANIES,
  SEALED_PRODUCT_TYPES,
  GRADE_OPTIONS,
  PRICE_TYPES,
  type ListingType,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
} from "@/types/database";

const MAX_PRICE = 100_000;

function sanitizePhotoLinks(raw: unknown): { links: string[]; error?: string } {
  if (!Array.isArray(raw)) return { links: [] };
  const links: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url) continue;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { links: [], error: `Invalid URL: ${url}` };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { links: [], error: `URL must start with http:// or https://: ${url}` };
    }
    links.push(url);
  }
  return { links };
}

export async function createListing(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to create a listing." };

  const cardId = formData.get("card_id") as string | null;
  const listingTypeRaw = formData.get("listing_type") as string | null;
  const conditionTypeRaw = formData.get("condition_type") as string | null;
  const rawConditionRaw = formData.get("raw_condition") as string | null;
  const sealedConditionRaw = formData.get("sealed_condition") as string | null;
  const gradingCompanyRaw = formData.get("grading_company") as string | null;
  const gradeStr = formData.get("grade") as string | null;
  const priceTypeRaw = formData.get("price_type") as string | null;
  const priceStr = formData.get("price") as string | null;
  const notes = (formData.get("notes") as string | null) || null;
  const photoLinksJson = formData.get("photo_links") as string | null;
  const photoNotes = (formData.get("photo_notes") as string | null) || null;

  if (!listingTypeRaw || !LISTING_TYPES.includes(listingTypeRaw as ListingType)) {
    return { error: "Invalid listing type." };
  }
  const listingType = listingTypeRaw as ListingType;

  if (!cardId) return { error: "No card selected." };
  const { data: card } = await supabase
    .from("cards")
    .select("id, product_type")
    .eq("id", cardId)
    .single();
  if (!card) return { error: "Card not found." };

  if (!conditionTypeRaw || !CONDITION_TYPES.includes(conditionTypeRaw as ConditionType)) {
    return { error: "Invalid condition type." };
  }
  const conditionType = conditionTypeRaw as ConditionType;

  let rawCondition: RawCondition | null = null;
  let sealedCondition: SealedCondition | null = null;
  let gradingCompany: GradingCompany | null = null;
  let grade: number | null = null;

  if (conditionType === "raw") {
    if (!rawConditionRaw || !RAW_CONDITIONS.includes(rawConditionRaw as RawCondition)) {
      return { error: "Invalid condition grade." };
    }
    rawCondition = rawConditionRaw as RawCondition;
  }

  if (conditionType === "sealed") {
    if (!SEALED_PRODUCT_TYPES.has(card.product_type)) {
      return { error: "Sealed condition is only valid for sealed products." };
    }
    if (!sealedConditionRaw || !SEALED_CONDITIONS.includes(sealedConditionRaw as SealedCondition)) {
      return { error: "Invalid sealed condition." };
    }
    sealedCondition = sealedConditionRaw as SealedCondition;
  }

  if (conditionType === "graded") {
    if (!gradingCompanyRaw || !GRADING_COMPANIES.includes(gradingCompanyRaw as GradingCompany)) {
      return { error: "Invalid grading company." };
    }
    if (!gradeStr) return { error: "Grade is required for graded items." };
    const parsedGrade = parseFloat(gradeStr);
    if (isNaN(parsedGrade)) return { error: "Invalid grade." };
    const validGrades = GRADE_OPTIONS[gradingCompanyRaw as GradingCompany];
    if (!validGrades.includes(parsedGrade)) {
      return { error: `Grade ${parsedGrade} is not valid for ${gradingCompanyRaw}.` };
    }
    gradingCompany = gradingCompanyRaw as GradingCompany;
    grade = parsedGrade;
  }

  if (!priceTypeRaw || !PRICE_TYPES.includes(priceTypeRaw as PriceType)) {
    return { error: "Invalid price type." };
  }
  const priceType = priceTypeRaw as PriceType;

  let price: number | null = null;
  if (priceType !== "open_to_offers") {
    if (!priceStr) return { error: "Price is required for this pricing type." };
    price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return { error: "Price must be a positive number." };
    if (price > MAX_PRICE) return { error: `Price cannot exceed $${MAX_PRICE.toLocaleString()}.` };
  }

  let photoLinks: string[] = [];
  if (photoLinksJson) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(photoLinksJson);
    } catch {
      return { error: "Invalid photo links." };
    }
    const { links, error: linkError } = sanitizePhotoLinks(parsed);
    if (linkError) return { error: linkError };
    photoLinks = links;
  }

  const { error: insertError } = await supabase.from("listings").insert({
    user_id: user.id,
    card_id: cardId,
    listing_type: listingType,
    condition_type: conditionType,
    raw_condition: rawCondition,
    sealed_condition: sealedCondition,
    grading_company: gradingCompany,
    grade,
    price_type: priceType,
    price,
    notes,
    photo_links: photoLinks,
    photo_notes: photoNotes,
    status: "active",
    is_featured: false,
  });

  if (insertError) {
    console.error("createListing:", insertError.message);
    return { error: "Failed to create listing. Please try again." };
  }

  redirect("/listings/mine?created=1");
}
