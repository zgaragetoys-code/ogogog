"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function markAsSold(listingId: string, isCustom: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const table = isCustom ? "custom_listings" : "listings";
  const { error } = await supabase
    .from(table)
    .update({ status: "sold" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    console.error("markAsSold:", error.message);
    return;
  }

  redirect(`/listings/mine`);
}

export async function cancelListing(listingId: string, isCustom: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const table = isCustom ? "custom_listings" : "listings";
  const { error } = await supabase
    .from(table)
    .update({ status: "cancelled" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    console.error("cancelListing:", error.message);
    return;
  }

  redirect(`/listings/mine`);
}
