"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendMessage(listingId: string, receiverId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty." };
  if (trimmed.length > 2000) return { error: "Message too long." };

  const { error } = await supabase.from("messages").insert({
    listing_id: listingId,
    sender_id: user.id,
    receiver_id: receiverId,
    content: trimmed,
  });

  if (error) {
    console.error("sendMessage:", error.message);
    return { error: "Failed to send message." };
  }
}
