"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return supabase;
}

export async function toggleFeatured(
  listingId: string,
  isCustom: boolean,
  featured: boolean,
  featuredUntil: string | null
) {
  const supabase = await assertAdmin();
  const table = isCustom ? "custom_listings" : "listings";
  await supabase
    .from(table)
    .update({
      is_featured: featured,
      featured_until: featured && featuredUntil ? new Date(featuredUntil).toISOString() : null,
    })
    .eq("id", listingId);
  revalidatePath("/admin/featured");
  revalidatePath("/browse");
  revalidatePath("/featured");
}
