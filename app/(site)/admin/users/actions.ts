"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Unauthorized");
}

export async function deleteUserListing(listingId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(`deleteUserListing: ${error.message}`);
  revalidatePath("/admin/users");
  revalidatePath("/browse");
}

export async function cancelUserListing(listingId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("listings").update({ status: "cancelled" }).eq("id", listingId);
  if (error) throw new Error(`cancelUserListing: ${error.message}`);
  revalidatePath("/admin/users");
  revalidatePath("/browse");
}

export async function deleteUserAccount(userId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`deleteUserAccount: ${error.message}`);
  revalidatePath("/admin/users");
}
