"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleBookmark(
  targetType: "listing" | "user",
  targetId: string
): Promise<{ bookmarked: boolean } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return { bookmarked: false };
  } else {
    await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, target_type: targetType, target_id: targetId });
    return { bookmarked: true };
  }
}
