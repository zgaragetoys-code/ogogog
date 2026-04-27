"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendMessageNotification } from "@/lib/email";
import { checkProfanity } from "@/lib/moderation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ogogog.com";

export async function sendMessage(listingId: string, receiverId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (receiverId === user.id) return { error: "You cannot message yourself." };

  const { data: listing } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return { error: "Listing not found." };
  if (listing.user_id !== receiverId) return { error: "Invalid recipient." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty." };
  if (trimmed.length > 2000) return { error: "Message too long." };
  const mod = checkProfanity(trimmed);
  if (!mod.ok) return { error: mod.reason };

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({ listing_id: listingId, sender_id: user.id, receiver_id: receiverId, content: trimmed })
    .select("id, sender_id, content, created_at")
    .single();

  if (error) {
    console.error("sendMessage:", error.message);
    return { error: "Failed to send message." };
  }

  // Email notification (non-blocking — don't fail the send if email errors)
  try {
    const adminClient = createAdminClient();
    const [{ data: receiverUser }, { data: senderProfile }, { data: listingData }] = await Promise.all([
      adminClient.auth.admin.getUserById(receiverId),
      supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle(),
      supabase.from("listings").select("title, card:cards(name)").eq("id", listingId).maybeSingle(),
    ]);

    const receiverEmail = receiverUser?.user?.email;
    if (receiverEmail) {
      const senderName = senderProfile?.display_name ?? senderProfile?.username ?? "Someone";
      const ld = listingData as unknown as { title: string | null; card: { name: string } | null } | null;
      const listingTitle = ld?.card?.name ?? ld?.title ?? "a listing";

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

  return { message: inserted };
}
