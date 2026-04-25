"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function markAsSold(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    console.error("markAsSold:", error.message);
    return;
  }

  revalidatePath("/browse");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/listings/mine");
  redirect(`/listings/mine`);
}

export async function cancelListing(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("listings")
    .update({ status: "cancelled" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    console.error("cancelListing:", error.message);
    return;
  }

  revalidatePath("/browse");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/listings/mine");
  redirect(`/listings/mine`);
}
