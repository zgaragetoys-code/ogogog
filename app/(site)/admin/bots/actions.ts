"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleBot(
  botId: string,
  field: "chat_enabled" | "posting_enabled",
  value: boolean
) {
  const admin = createAdminClient();
  await admin.from("bots").update({ [field]: value }).eq("id", botId);
}

export async function bulkToggleBots(
  field: "chat_enabled" | "posting_enabled",
  value: boolean,
  limit?: number
) {
  const admin = createAdminClient();

  if (limit) {
    // Toggle N bots: pick least-recently-active ones
    const { data } = await admin
      .from("bots")
      .select("id")
      .eq(field, !value)
      .order("last_active_at", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (!data || data.length === 0) {
      revalidatePath("/admin/bots");
      return;
    }
    const ids = data.map((b) => b.id);
    await admin.from("bots").update({ [field]: value }).in("id", ids);
  } else {
    // Toggle ALL
    await admin.from("bots").update({ [field]: value });
  }

  revalidatePath("/admin/bots");
}

export async function triggerBotTick(count: number = 8) {
  const secret = process.env.BOT_TICK_SECRET;
  if (!secret) return { ok: false, sent: 0, error: "BOT_TICK_SECRET not set" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${siteUrl}/api/bots/tick`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bot-secret": secret,
    },
    body: JSON.stringify({ count }),
  });

  if (!res.ok) return { ok: false, sent: 0, error: `HTTP ${res.status}` };
  const json = await res.json();
  return json as { ok: boolean; sent: number };
}
