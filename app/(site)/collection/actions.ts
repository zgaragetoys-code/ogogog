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

export async function addToCollection(cardId: string, quantity: number, condition?: ConditionFields) {
  const { supabase, user } = await getUser();
  await supabase.from("collection_items").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      quantity,
      for_sale: false,
      ...(condition ?? {}),
    },
    { onConflict: "user_id,card_id", ignoreDuplicates: false }
  );
  revalidatePath("/collection");
}

export async function removeFromCollection(itemId: string) {
  const { supabase, user } = await getUser();
  await supabase
    .from("collection_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);
  revalidatePath("/collection");
}

export async function updateCollectionItem(
  itemId: string,
  updates: { quantity?: number; for_sale?: boolean }
) {
  const { supabase, user } = await getUser();
  await supabase
    .from("collection_items")
    .update(updates)
    .eq("id", itemId)
    .eq("user_id", user.id);
  revalidatePath("/collection");
}
