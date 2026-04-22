"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  LISTING_TYPES,
  CUSTOM_CATEGORIES,
  GENERIC_CONDITIONS,
  PRICE_TYPES,
  type ListingType,
  type CustomCategory,
  type GenericCondition,
  type PriceType,
} from "@/types/database";

const MAX_PRICE = 100_000;
const MAX_TITLE_LENGTH = 100;

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

export async function createCustomListing(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to create a listing." };

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const categoryRaw = formData.get("custom_category") as string | null;
  const conditionRaw = formData.get("condition_generic") as string | null;
  const listingTypeRaw = formData.get("listing_type") as string | null;
  const priceTypeRaw = formData.get("price_type") as string | null;
  const priceStr = formData.get("price") as string | null;
  const notes = (formData.get("notes") as string | null) || null;
  const photoLinksJson = formData.get("photo_links") as string | null;
  const photoNotes = (formData.get("photo_notes") as string | null) || null;

  if (!title) return { error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
  if (!description) return { error: "Description is required." };

  if (!categoryRaw || !CUSTOM_CATEGORIES.includes(categoryRaw as CustomCategory)) {
    return { error: "Invalid category." };
  }
  const customCategory = categoryRaw as CustomCategory;

  if (!conditionRaw || !GENERIC_CONDITIONS.includes(conditionRaw as GenericCondition)) {
    return { error: "Invalid condition." };
  }
  const conditionGeneric = conditionRaw as GenericCondition;

  if (!listingTypeRaw || !LISTING_TYPES.includes(listingTypeRaw as ListingType)) {
    return { error: "Invalid listing type." };
  }
  const listingType = listingTypeRaw as ListingType;

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

  const { error: insertError } = await supabase.from("custom_listings").insert({
    user_id: user.id,
    title,
    description,
    custom_category: customCategory,
    condition_generic: conditionGeneric,
    listing_type: listingType,
    price_type: priceType,
    price,
    notes,
    photo_links: photoLinks,
    photo_notes: photoNotes,
    status: "active",
  });

  if (insertError) {
    console.error("createCustomListing:", insertError.message);
    return { error: "Failed to create listing. Please try again." };
  }

  redirect("/listings/mine?created=1");
}
