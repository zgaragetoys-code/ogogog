"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkProfanity } from "@/lib/moderation";
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
const MAX_TITLE = 100;

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

export async function updateListing(
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

  const isCard = !!listing.card_id;

  // ── Shared: price ─────────────────────────────────────────────────────────
  const priceTypeRaw = formData.get("price_type") as string | null;
  if (!priceTypeRaw || !PRICE_TYPES.includes(priceTypeRaw as PriceType))
    return { error: "Invalid price type." };
  const priceType = priceTypeRaw as PriceType;

  let price: number | null = null;
  if (priceType !== "open_to_offers") {
    const priceStr = formData.get("price") as string | null;
    if (!priceStr) return { error: "Price is required." };
    price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return { error: "Price must be a positive number." };
    if (price > MAX_PRICE) return { error: `Price cannot exceed $${MAX_PRICE.toLocaleString()}.` };
  }

  // ── Shared: photos + notes ─────────────────────────────────────────────────
  const notes = (formData.get("notes") as string | null) || null;
  const photoNotes = (formData.get("photo_notes") as string | null) || null;
  const photoLinksJson = formData.get("photo_links") as string | null;
  const certNumber = (formData.get("cert_number") as string | null)?.trim() || null;

  if (notes) { const m = checkProfanity(notes); if (!m.ok) return { error: m.reason }; }
  if (photoNotes) { const m = checkProfanity(photoNotes); if (!m.ok) return { error: m.reason }; }
  if (certNumber && certNumber.length > 20) return { error: "Cert number must be 20 characters or fewer." };

  let photoLinks: string[] = [];
  if (photoLinksJson) {
    let parsed: unknown;
    try { parsed = JSON.parse(photoLinksJson); } catch { return { error: "Invalid photo links." }; }
    const { links, error: linkError } = sanitizePhotoLinks(parsed);
    if (linkError) return { error: linkError };
    photoLinks = links;
  }

  const updates: Record<string, unknown> = {
    price_type: priceType,
    price,
    notes,
    photo_links: photoLinks,
    photo_notes: photoNotes,
    cert_number: certNumber,
  };

  // ── Catalog: condition ─────────────────────────────────────────────────────
  if (isCard) {
    const conditionType = formData.get("condition_type") as string | null;
    const rawConditionRaw = formData.get("raw_condition") as string | null;
    const sealedConditionRaw = formData.get("sealed_condition") as string | null;
    const gradingCompanyRaw = formData.get("grading_company") as string | null;
    const gradeStr = formData.get("grade") as string | null;

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

    Object.assign(updates, {
      condition_type: conditionType,
      raw_condition: rawCondition,
      sealed_condition: sealedCondition,
      grading_company: gradingCompany,
      grade,
    });
  } else {
    // ── Custom: identity + metadata ──────────────────────────────────────────
    const titleRaw = (formData.get("title") as string | null)?.trim();
    if (!titleRaw) return { error: "Title is required." };
    if (titleRaw.length > MAX_TITLE) return { error: `Title must be ${MAX_TITLE} characters or fewer.` };

    const customCategoryRaw = formData.get("custom_category") as string | null;
    if (!customCategoryRaw || !CUSTOM_CATEGORIES.includes(customCategoryRaw as CustomCategory))
      return { error: "Invalid category." };

    const conditionGenericRaw = formData.get("condition_generic") as string | null;
    const conditionGeneric: GenericCondition | null =
      conditionGenericRaw && GENERIC_CONDITIONS.includes(conditionGenericRaw as GenericCondition)
        ? (conditionGenericRaw as GenericCondition)
        : null;

    const setYearRaw = formData.get("set_year") as string | null;
    let setYear: number | null = null;
    if (setYearRaw) {
      const y = parseInt(setYearRaw);
      if (!isNaN(y) && y >= 1996 && y <= 2030) setYear = y;
    }

    const setSeriesRaw = (formData.get("set_series") as string | null)?.trim() || null;

    const imageUrlRaw = (formData.get("listing_image_url") as string | null)?.trim() || null;
    let listingImageUrl: string | null = null;
    if (imageUrlRaw) {
      if (!imageUrlRaw.startsWith("http://") && !imageUrlRaw.startsWith("https://"))
        return { error: "Image URL must start with http:// or https://" };
      listingImageUrl = imageUrlRaw;
    }

    Object.assign(updates, {
      title: titleRaw,
      custom_category: customCategoryRaw as CustomCategory,
      condition_generic: conditionGeneric,
      set_year: setYear,
      set_series: setSeriesRaw,
      listing_image_url: listingImageUrl,
    });
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("updateListing:", updateError.message);
    return { error: "Failed to save changes." };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/browse");
  redirect(`/listings/${listingId}`);
}
