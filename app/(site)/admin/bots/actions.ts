"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runBotTick } from "@/lib/bots/tick";

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
    // Toggle ALL — .not() filter required; PostgREST rejects filterless updates
    await admin.from("bots").update({ [field]: value }).not("id", "is", null);
  }

  revalidatePath("/admin/bots");
}

export async function triggerBotTick(count: number = 8) {
  return runBotTick(count);
}
