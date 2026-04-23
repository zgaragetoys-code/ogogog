"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  RAW_CONDITIONS,
  SEALED_CONDITIONS,
  GRADING_COMPANIES,
  SEALED_PRODUCT_TYPES,
  GRADE_OPTIONS,
  PRICE_TYPES,
  CUSTOM_CATEGORIES,
  GENERIC_CONDITIONS,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
  type CustomCategory,
  type GenericCondition,
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
    try { parsed = new URL(url); } catch { return { links: [], error: `Invalid URL: ${url}` }; }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return { links: [], error: `URL must start with http:// or https://` };
    links.push(url);
  }
  return { links };
}

export async function updateCardListing(
  listingId: string,
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, card_id, card:cards(product_type)")
    .eq("id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listing) return { error: "Listing not found." };

  const conditionType = formData.get("condition_type") as string | null;
  const rawConditionRaw = formData.get("raw_condition") as string | null;
  const sealedConditionRaw = formData.get("sealed_condition") as string | null;
  const gradingCompanyRaw = formData.get("grading_company") as string | null;
  const gradeStr = formData.get("grade") as string | null;
  const priceTypeRaw = formData.get("price_type") as string | null;
  const priceStr = formData.get("price") as string | null;
  const notes = (formData.get("notes") as string | null) || null;
  const photoLinksJson = formData.get("photo_links") as string | null;
  const photoNotes = (formData.get("photo_notes") as string | null) || null;

  let rawCondition: RawCondition | null = null;
  let sealedCondition: SealedCondition | null = null;
  let gradingCompany: GradingCompany | null = null;
  let grade: number | null = null;

  if (conditionType === "raw") {
    if (!rawConditionRaw || !RAW_CONDITIONS.includes(rawConditionRaw as RawCondition))
      return { error: "Invalid condition grade." };
    rawCondition = rawConditionRaw as RawCondition;
  } else if (conditionType === "sealed") {
    const card = listing.card as unknown as { product_type: string };
    if (!SEALED_PRODUCT_TYPES.has(card.product_type as never))
      return { error: "Sealed condition is only valid for sealed products." };
    if (!sealedConditionRaw || !SEALED_CONDITIONS.includes(sealedConditionRaw as SealedCondition))
      return { error: "Invalid sealed condition." };
    sealedCondition = sealedConditionRaw as SealedCondition;
  } else if (conditionType === "graded") {
    if (!gradingCompanyRaw || !GRADING_COMPANIES.includes(gradingCompanyRaw as GradingCompany))
      return { error: "Invalid grading company." };
    if (!gradeStr) return { error: "Grade is required." };
    const parsedGrade = parseFloat(gradeStr);
    if (isNaN(parsedGrade)) return { error: "Invalid grade." };
    const validGrades = GRADE_OPTIONS[gradingCompanyRaw as GradingCompany];
    if (!validGrades.includes(parsedGrade)) return { error: `Grade ${parsedGrade} is not valid.` };
    gradingCompany = gradingCompanyRaw as GradingCompany;
    grade = parsedGrade;
  } else {
    return { error: "Invalid condition type." };
  }

  if (!priceTypeRaw || !PRICE_TYPES.includes(priceTypeRaw as PriceType))
    return { error: "Invalid price type." };
  const priceType = priceTypeRaw as PriceType;

  let price: number | null = null;
  if (priceType !== "open_to_offers") {
    if (!priceStr) return { error: "Price is required." };
    price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return { error: "Price must be a positive number." };
    if (price > MAX_PRICE) return { error: `Price cannot exceed $${MAX_PRICE.toLocaleString()}.` };
  }

  let photoLinks: string[] = [];
  if (photoLinksJson) {
    let parsed: unknown;
    try { parsed = JSON.parse(photoLinksJson); } catch { return { error: "Invalid photo links." }; }
    const { links, error: linkError } = sanitizePhotoLinks(parsed);
    if (linkError) return { error: linkError };
    photoLinks = links;
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({
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
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("updateCardListing:", updateError.message);
    return { error: "Failed to save changes." };
  }

  redirect(`/listings/${listingId}`);
}

export async function updateCustomListing(
  listingId: string,
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const categoryRaw = formData.get("custom_category") as string | null;
  const conditionRaw = formData.get("condition_generic") as string | null;
  const priceTypeRaw = formData.get("price_type") as string | null;
  const priceStr = formData.get("price") as string | null;
  const notes = (formData.get("notes") as string | null) || null;
  const photoLinksJson = formData.get("photo_links") as string | null;
  const photoNotes = (formData.get("photo_notes") as string | null) || null;

  if (!title) return { error: "Title is required." };
  if (!categoryRaw || !CUSTOM_CATEGORIES.includes(categoryRaw as CustomCategory))
    return { error: "Invalid category." };
  if (!conditionRaw || !GENERIC_CONDITIONS.includes(conditionRaw as GenericCondition))
    return { error: "Invalid condition." };
  if (!priceTypeRaw || !PRICE_TYPES.includes(priceTypeRaw as PriceType))
    return { error: "Invalid price type." };

  const priceType = priceTypeRaw as PriceType;
  let price: number | null = null;
  if (priceType !== "open_to_offers") {
    if (!priceStr) return { error: "Price is required." };
    price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return { error: "Price must be a positive number." };
    if (price > MAX_PRICE) return { error: `Price cannot exceed $${MAX_PRICE.toLocaleString()}.` };
  }

  let photoLinks: string[] = [];
  if (photoLinksJson) {
    let parsed: unknown;
    try { parsed = JSON.parse(photoLinksJson); } catch { return { error: "Invalid photo links." }; }
    const { links, error: linkError } = sanitizePhotoLinks(parsed);
    if (linkError) return { error: linkError };
    photoLinks = links;
  }

  const { error: updateError } = await supabase
    .from("custom_listings")
    .update({
      title,
      description,
      custom_category: categoryRaw as CustomCategory,
      condition_generic: conditionRaw as GenericCondition,
      price_type: priceType,
      price,
      notes,
      photo_links: photoLinks,
      photo_notes: photoNotes,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("updateCustomListing:", updateError.message);
    return { error: "Failed to save changes." };
  }

  redirect(`/listings/${listingId}`);
}
