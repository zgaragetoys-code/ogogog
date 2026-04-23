"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendMessageNotification } from "@/lib/email";
import { checkProfanity } from "@/lib/moderation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ogogog.com";

export async function sendDirectMessage(receiverId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Message cannot be empty." };
  if (trimmed.length > 2000) return { error: "Message too long." };
  const mod = checkProfanity(trimmed);
  if (!mod.ok) return { error: mod.reason };

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({ listing_id: null, sender_id: user.id, receiver_id: receiverId, content: trimmed })
    .select("id, sender_id, content, created_at")
    .single();

  if (error) {
    console.error("sendDirectMessage:", error.message);
    return { error: "Failed to send message." };
  }

  try {
    const adminClient = createAdminClient();
    const [{ data: receiverUser }, { data: senderProfile }] = await Promise.all([
      adminClient.auth.admin.getUserById(receiverId),
      supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle(),
    ]);

    const receiverEmail = receiverUser?.user?.email;
    if (receiverEmail) {
      const senderName = senderProfile?.display_name ?? senderProfile?.username ?? "Someone";
      await sendMessageNotification({
        toEmail: receiverEmail,
        toName: senderName,
        fromName: senderName,
        listingTitle: "general chat",
        messageContent: trimmed,
        threadUrl: `${SITE_URL}/messages/direct/${user.id}`,
      });
    }
  } catch {
    // Silent — message already sent
  }

  return { message: inserted };
}
