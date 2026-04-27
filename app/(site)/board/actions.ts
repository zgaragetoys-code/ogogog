"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkProfanity } from "@/lib/moderation";
import { revalidatePath } from "next/cache";

const POST_COOLDOWN_MS = 30_000; // 30s between board posts

export async function createBoardPost(
  raw: string,
  postType: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const validTypes = ["general", "buying", "selling", "trading", "looking_for"];
  if (!validTypes.includes(postType)) return { error: "Invalid post type." };

  const trimmed = raw.trim();
  if (!trimmed) return { error: "Post cannot be empty." };
  if (trimmed.length > 500) return { error: "Post too long (500 chars max)." };
  const mod = checkProfanity(trimmed);
  if (!mod.ok) return { error: mod.reason };

  // Best-effort cooldown check — race conditions possible under concurrent requests
  const since = new Date(Date.now() - POST_COOLDOWN_MS).toISOString();
  const { count } = await supabase
    .from("board_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("created_at", since);
  if ((count ?? 0) > 0) return { error: "Please wait 30 seconds between posts." };

  const { error } = await supabase.from("board_posts").insert({
    user_id: user.id,
    content: trimmed,
    post_type: postType,
  });
  if (error) {
    const { count: recent } = await supabase
      .from("board_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", since);
    if ((recent ?? 0) > 0) return { error: "Please wait 30 seconds between posts." };
    return { error: "Failed to create post." };
  }

  revalidatePath("/board");
}

export async function deleteBoardPost(postId: string): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("board_posts")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Post not found." };

  if (post.user_id !== user.id && !isAdmin) return { error: "Not authorized." };

  const { error } = await admin
    .from("board_posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) {
    console.error("deleteBoardPost:", error.message);
    return { error: "Failed to delete post." };
  }

  revalidatePath("/board");
}
