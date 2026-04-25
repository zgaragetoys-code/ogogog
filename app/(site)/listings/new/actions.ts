"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkProfanity } from "@/lib/moderation";
import {
  LISTING_TYPES,
  CONDITION_TYPES,
  RAW_CONDITIONS,
  SEALED_CONDITIONS,
  GRADING_COMPANIES,
  SEALED_PRODUCT_TYPES,
  GRADE_OPTIONS,
  PRICE_TYPES,
  CUSTOM_CATEGORIES,
  GENERIC_CONDITIONS,
  PRODUCT_TYPES,
  type ListingType,
  type ConditionType,
  type RawCondition,
  type SealedCondition,
  type GradingCompany,
  type PriceType,
  type CustomCategory,
  type GenericCondition,
  type ProductType,
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
    try { parsed = new URL(url); } catch {
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to create a listing." };

  const mode = formData.get("mode") as string | null;
  const listingTypeRaw = formData.get("listing_type") as string | null;
  if (!listingTypeRaw || !LISTING_TYPES.includes(listingTypeRaw as ListingType)) {
    return { error: "Invalid listing type." };
  }
  const listingType = listingTypeRaw as ListingType;

  // ── Identity: catalog card OR custom title ──────────────────────────────
  let cardId: string | null = null;
  let title: string | null = null;
  let customCategory: CustomCategory | null = null;
  let productTypeOverride: ProductType | null = null;
  let setNameCustom: string | null = null;
  let setYear: number | null = null;
  let setSeries: string | null = null;
  let listingImageUrl: string | null = null;

  if (mode === "catalog") {
    const cardIdRaw = formData.get("card_id") as string | null;
    if (!cardIdRaw) return { error: "No card selected." };
    const { data: card } = await supabase.from("cards").select("id, product_type, release_date").eq("id", cardIdRaw).maybeSingle();
    if (!card) return { error: "Card not found." };
    cardId = cardIdRaw;
    // Auto-populate year from card release_date
    if (card.release_date) {
      setYear = new Date(card.release_date).getFullYear();
    }
  } else {
    const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
    if (!titleRaw) return { error: "Title is required." };
    if (titleRaw.length > MAX_TITLE) return { error: `Title must be ${MAX_TITLE} characters or fewer.` };
    title = titleRaw;

    const customCategoryRaw = formData.get("custom_category") as string | null;
    if (customCategoryRaw && CUSTOM_CATEGORIES.includes(customCategoryRaw as CustomCategory)) {
      customCategory = customCategoryRaw as CustomCategory;
    }

    const productTypeRaw = formData.get("product_type") as string | null;
    if (productTypeRaw && PRODUCT_TYPES.includes(productTypeRaw as ProductType)) {
      productTypeOverride = productTypeRaw as ProductType;
    }

    const setNameRaw = (formData.get("set_name_custom") as string | null)?.trim() || null;
    setNameCustom = setNameRaw;

    const setYearRaw = formData.get("set_year") as string | null;
    if (setYearRaw) {
      const y = parseInt(setYearRaw);
      if (!isNaN(y) && y >= 1996 && y <= 2030) setYear = y;
    }

    const setSeriesRaw = (formData.get("set_series") as string | null)?.trim() || null;
    setSeries = setSeriesRaw;

    const imageUrlRaw = (formData.get("listing_image_url") as string | null)?.trim() || null;
    if (imageUrlRaw) {
      if (!imageUrlRaw.startsWith("http://") && !imageUrlRaw.startsWith("https://")) {
        return { error: "Image URL must start with http:// or https://" };
      }
      listingImageUrl = imageUrlRaw;
    }
  }

  // ── Condition ──────────────────────────────────────────────────────────
  const conditionTypeRaw = formData.get("condition_type") as string | null;
  const rawConditionRaw = formData.get("raw_condition") as string | null;
  const sealedConditionRaw = formData.get("sealed_condition") as string | null;
  const gradingCompanyRaw = formData.get("grading_company") as string | null;
  const gradeStr = formData.get("grade") as string | null;
  const conditionGenericRaw = formData.get("condition_generic") as string | null;

  let conditionType: ConditionType | null = null;
  let rawCondition: RawCondition | null = null;
  let sealedCondition: SealedCondition | null = null;
  let gradingCompany: GradingCompany | null = null;
  let grade: number | null = null;
  let conditionGeneric: GenericCondition | null = null;

  if (conditionTypeRaw && CONDITION_TYPES.includes(conditionTypeRaw as ConditionType)) {
    conditionType = conditionTypeRaw as ConditionType;
  } else if (conditionTypeRaw) {
    return { error: "Invalid condition type." };
  } else if (listingType === "for_sale" && mode === "catalog") {
    return { error: "Condition is required for sale listings." };
  }

  if (conditionType === "raw") {
    if (rawConditionRaw) {
      if (!RAW_CONDITIONS.includes(rawConditionRaw as RawCondition))
        return { error: "Invalid condition grade." };
      rawCondition = rawConditionRaw as RawCondition;
    }
    // blank rawCondition = "any grade" — valid
  }

  if (conditionType === "sealed") {
    if (cardId) {
      const { data: cardCheck } = await supabase.from("cards").select("product_type").eq("id", cardId).maybeSingle();
      if (cardCheck && !SEALED_PRODUCT_TYPES.has(cardCheck.product_type)) {
        return { error: "Sealed condition is only valid for sealed products." };
      }
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
    gradingCompany = gradingCompanyRaw as GradingCompany;
    if (gradeStr) {
      const parsedGrade = parseFloat(gradeStr);
      if (isNaN(parsedGrade)) return { error: "Invalid grade." };
      const validGrades = GRADE_OPTIONS[gradingCompanyRaw as GradingCompany];
      if (!validGrades.includes(parsedGrade)) {
        return { error: `Grade ${parsedGrade} is not valid for ${gradingCompanyRaw}.` };
      }
      grade = parsedGrade;
    } else if (listingType === "for_sale") {
      return { error: "Grade is required for graded sale listings." };
    }
  }

  if (conditionGenericRaw && GENERIC_CONDITIONS.includes(conditionGenericRaw as GenericCondition)) {
    conditionGeneric = conditionGenericRaw as GenericCondition;
  }

  // ── Price ──────────────────────────────────────────────────────────────
  const priceTypeRaw = formData.get("price_type") as string | null;
  if (!priceTypeRaw || !PRICE_TYPES.includes(priceTypeRaw as PriceType)) {
    return { error: "Invalid price type." };
  }
  const priceType = priceTypeRaw as PriceType;

  let price: number | null = null;
  if (priceType !== "open_to_offers") {
    const priceStr = formData.get("price") as string | null;
    if (!priceStr) return { error: "Price is required." };
    price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return { error: "Price must be a positive number." };
    if (price > MAX_PRICE) return { error: `Price cannot exceed $${MAX_PRICE.toLocaleString()}.` };
  }

  // ── Cert number ────────────────────────────────────────────────────────
  const certNumber = (formData.get("cert_number") as string | null)?.trim() || null;
  if (certNumber && certNumber.length > 20) return { error: "Cert number must be 20 characters or fewer." };

  // ── Photos ─────────────────────────────────────────────────────────────
  const photoLinksJson = formData.get("photo_links") as string | null;
  const photoNotes = (formData.get("photo_notes") as string | null) || null;
  const notes = (formData.get("notes") as string | null) || null;

  if (notes) {
    const notesMod = checkProfanity(notes);
    if (!notesMod.ok) return { error: notesMod.reason };
  }
  if (photoNotes) {
    const photoNotesMod = checkProfanity(photoNotes);
    if (!photoNotesMod.ok) return { error: photoNotesMod.reason };
  }
  if (title) {
    const titleMod = checkProfanity(title);
    if (!titleMod.ok) return { error: titleMod.reason };
  }

  let photoLinks: string[] = [];
  if (photoLinksJson) {
    let parsed: unknown;
    try { parsed = JSON.parse(photoLinksJson); } catch {
      return { error: "Invalid photo links." };
    }
    const { links, error: linkError } = sanitizePhotoLinks(parsed);
    if (linkError) return { error: linkError };
    photoLinks = links;
  }

  // ── Insert ─────────────────────────────────────────────────────────────
  const { error: insertError } = await supabase.from("listings").insert({
    user_id: user.id,
    card_id: cardId,
    title,
    custom_category: customCategory,
    set_year: setYear,
    set_series: setSeries,
    listing_image_url: listingImageUrl,
    listing_type: listingType,
    condition_type: conditionType,
    raw_condition: rawCondition,
    sealed_condition: sealedCondition,
    grading_company: gradingCompany,
    grade,
    cert_number: certNumber,
    condition_generic: conditionGeneric,
    price_type: priceType,
    price,
    notes,
    photo_links: photoLinks,
    photo_notes: photoNotes,
    status: "active",
    is_featured: false,
  });

  if (insertError) {
    console.error("createListing:", insertError.message, insertError.code);
    return { error: "Failed to create listing. Please try again." };
  }

  revalidatePath("/listings/mine");
  revalidatePath("/browse");
  redirect("/listings/mine?created=1");
}
