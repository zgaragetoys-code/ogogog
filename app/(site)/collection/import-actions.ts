"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ImportRow = {
  card_id: string;
  quantity: number;
};

export async function bulkImportCollection(rows: ImportRow[]) {
  if (rows.length === 0) return { count: 0 };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const records = rows.map(r => ({
    user_id: user.id,
    card_id: r.card_id,
    quantity: r.quantity,
    for_sale: false,
  }));

  await supabase
    .from("collection_items")
    .upsert(records, { onConflict: "user_id,card_id", ignoreDuplicates: false });

  revalidatePath("/collection");
  return { count: rows.length };
}

export async function lookupCardsByName(
  names: string[]
): Promise<{ id: string; name: string; set_name: string; card_number: string; image_url: string | null }[]> {
  if (names.length === 0) return [];
  const supabase = await createClient();

  // Fetch all cards whose name matches any of the provided names (case-insensitive)
  const { data } = await supabase
    .from("cards")
    .select("id, name, set_name, set_code, card_number, image_url")
    .in("name", names)
    .order("set_code", { ascending: false });

  return (data ?? []) as { id: string; name: string; set_name: string; card_number: string; image_url: string | null }[];
}
