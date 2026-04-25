"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { moderateMessage } from "@/lib/moderation";

const COOLDOWN_MS = 10_000;

export async function sendChatMessage(
  raw: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("global_chat_enabled")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.global_chat_enabled)
    return { error: "Global chat is disabled in your settings." };

  const modResult = moderateMessage(raw);
  if (!modResult.ok) return { error: modResult.reason };

  const since = new Date(Date.now() - COOLDOWN_MS).toISOString();
  const { count } = await supabase
    .from("global_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .gte("created_at", since);
  if ((count ?? 0) > 0)
    return { error: "Please wait 10 seconds between messages." };

  const { error } = await supabase.from("global_chat_messages").insert({
    user_id: user.id,
    content: raw.trim(),
  });
  if (error) return { error: "Failed to send message." };
}

export async function deleteChatMessage(
  messageId: string
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const isAdmin = user.email === process.env.ADMIN_EMAIL;

  // Use service role so we can read and soft-delete bot messages (which have
  // user_id = bot UUID that doesn't exist in auth.users, so RLS blocks them)
  const admin = createAdminClient();
  const { data: msg } = await admin
    .from("global_chat_messages")
    .select("user_id, bot_id")
    .eq("id", messageId)
    .maybeSingle();
  if (!msg) return { error: "Message not found." };

  const isOwner = msg.user_id === user.id;
  if (!isOwner && !isAdmin) return { error: "Not authorized." };

  const { error } = await admin
    .from("global_chat_messages")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", messageId);
  if (error) {
    console.error("deleteChatMessage:", error.message);
    return { error: "Failed to delete message." };
  }
}
