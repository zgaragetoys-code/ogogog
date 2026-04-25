"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runBotTick, runSingleBotTick } from "@/lib/bots/tick";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");
}

export async function toggleBot(
  botId: string,
  field: "chat_enabled" | "posting_enabled",
  value: boolean
) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("bots").update({ [field]: value }).eq("id", botId);
  if (error) throw new Error(`toggleBot: ${error.message}`);
  revalidatePath("/admin/bots");
}

export async function fireBotNow(botId: string): Promise<{ ok: boolean; content?: string }> {
  await assertAdmin();
  try {
    const content = await runSingleBotTick(botId);
    return { ok: true, content };
  } catch {
    return { ok: false };
  }
}

export async function bulkToggleBots(
  field: "chat_enabled" | "posting_enabled",
  value: boolean,
  limit?: number
) {
  await assertAdmin();
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
    const { error } = await admin.from("bots").update({ [field]: value }).in("id", ids);
    if (error) throw new Error(`bulkToggleBots: ${error.message}`);
  } else {
    // Toggle ALL — .not() filter required; PostgREST rejects filterless updates
    const { error } = await admin.from("bots").update({ [field]: value }).not("id", "is", null);
    if (error) throw new Error(`bulkToggleBots: ${error.message}`);
  }

  revalidatePath("/admin/bots");
}

export async function triggerBotTick(count: number = 8) {
  return runBotTick(count);
}
