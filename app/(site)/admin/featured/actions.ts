"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return supabase;
}

export async function cancelAnyListing(listingId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("listings").update({ status: "cancelled" }).eq("id", listingId);
  if (error) throw new Error(`cancelAnyListing: ${error.message}`);
  revalidatePath("/admin/featured");
  revalidatePath("/browse");
  revalidatePath("/featured");
}

export async function deleteAnyListing(listingId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(`deleteAnyListing: ${error.message}`);
  revalidatePath("/admin/featured");
  revalidatePath("/browse");
  revalidatePath("/featured");
}

export async function toggleFeatured(
  listingId: string,
  featured: boolean,
  featuredUntil: string | null
) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("listings")
    .update({
      is_featured: featured,
      featured_until: featured && featuredUntil ? new Date(featuredUntil).toISOString() : null,
    })
    .eq("id", listingId);
  if (error) throw new Error(`toggleFeatured: ${error.message}`);
  revalidatePath("/admin/featured");
  revalidatePath("/browse");
  revalidatePath("/featured");
}
