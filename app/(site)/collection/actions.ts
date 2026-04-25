"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ConditionType, RawCondition, GradingCompany } from "@/types/database";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

type ConditionFields = {
  condition_type: ConditionType | null;
  raw_condition: RawCondition | null;
  grading_company: GradingCompany | null;
  grade: number | null;
  notes: string | null;
};

export async function addToCollection(cardId: string, quantity: number, condition?: ConditionFields): Promise<{ error: string } | { id: string }> {
  const { supabase, user } = await getUser();
  const { data, error } = await supabase.from("collection_items").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      quantity,
      // omit for_sale so existing value is preserved on conflict
      ...(condition ?? {}),
    },
    { onConflict: "user_id,card_id", ignoreDuplicates: false }
  ).select("id").single();
  if (error) {
    console.error("addToCollection:", error.message);
    return { error: "Failed to add to collection." };
  }
  revalidatePath("/collection");
  return { id: data.id };
}

export async function removeFromCollection(itemId: string): Promise<{ error: string } | void> {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    console.error("removeFromCollection:", error.message);
    return { error: "Failed to remove from collection." };
  }
  revalidatePath("/collection");
}

export async function updateCollectionItem(
  itemId: string,
  updates: { quantity?: number; for_sale?: boolean }
): Promise<{ error: string } | void> {
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("collection_items")
    .update(updates)
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    console.error("updateCollectionItem:", error.message);
    return { error: "Failed to update collection item." };
  }
  revalidatePath("/collection");
}

export async function togglePinned(
  itemId: string,
  pin: boolean,
  currentPinnedCount: number
): Promise<{ error: string } | void> {
  if (pin && currentPinnedCount >= 6) return { error: "You can pin at most 6 items." };
  const { supabase, user } = await getUser();
  const { error } = await supabase
    .from("collection_items")
    .update({ pinned: pin } as any)
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    console.error("togglePinned:", error.message);
    return { error: "Could not update — run migration 019 in Supabase SQL Editor." };
  }
  revalidatePath("/collection");
  const { data: profile } = await supabase
    .from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (profile?.username) {
    revalidatePath(`/u/${profile.username}`);
    revalidatePath(`/u/${profile.username}/collection`);
  }
}
