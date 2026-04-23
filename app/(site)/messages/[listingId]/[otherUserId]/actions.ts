"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessageNotification } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ogogog.com";

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

  // Email notification (non-blocking — don't fail the send if email errors)
  try {
    const [{ data: receiverUser }, { data: senderProfile }, { data: cardListing }, { data: customListing }] = await Promise.all([
      supabase.auth.admin.getUserById(receiverId),
      supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle(),
      supabase.from("listings").select("card:cards(name)").eq("id", listingId).maybeSingle(),
      supabase.from("custom_listings").select("title").eq("id", listingId).maybeSingle(),
    ]);

    const receiverEmail = receiverUser?.user?.email;
    if (receiverEmail) {
      const senderName = senderProfile?.display_name ?? senderProfile?.username ?? "Someone";
      const listingTitle = cardListing
        ? (cardListing as unknown as { card: { name: string } }).card.name
        : (customListing as { title: string } | null)?.title ?? "a listing";

      await sendMessageNotification({
        toEmail: receiverEmail,
        toName: senderName,
        fromName: senderName,
        listingTitle,
        messageContent: trimmed,
        threadUrl: `${SITE_URL}/messages/${listingId}/${user.id}`,
      });
    }
  } catch {
    // Email failure is silent — message was already sent successfully
  }
}
