import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Check for existing bot messages
  const { data: recent, count: totalBotMsgs } = await sb
    .from("global_chat_messages")
    .select("id, bot_id, content, created_at", { count: "exact" })
    .not("bot_id", "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log(`Total bot messages in DB: ${totalBotMsgs}`);
  if (recent && recent.length > 0) {
    console.log("Most recent bot messages:");
    recent.forEach((m: any) => {
      const age = Math.round((Date.now() - new Date(m.created_at).getTime()) / 60000);
      console.log(`  [${age}m ago] ${m.content.slice(0, 60)}`);
    });
  } else {
    console.log("No bot messages found.");
  }

  // 2. Trigger a tick directly (2 bots)
  console.log("\nTriggering bot tick (2 bots)...");
  const { runBotTick } = await import("../lib/bots/tick");
  const result = await runBotTick(2);
  console.log(`Tick result: ok=${result.ok}, sent=${result.sent}`);

  // 3. Verify new messages appeared
  const { count: newTotal } = await sb
    .from("global_chat_messages")
    .select("*", { count: "exact", head: true })
    .not("bot_id", "is", null)
    .is("deleted_at", null);

  console.log(`Bot messages after tick: ${newTotal} (was ${totalBotMsgs})`);

  if ((newTotal ?? 0) > (totalBotMsgs ?? 0)) {
    console.log("\n✓ BOTS WORK — messages are being inserted into the database");
  } else if (result.sent === 0) {
    console.log("\n✗ Tick ran but sent 0 messages — check if any bots have chat_enabled=true");
    const { count: enabledCount } = await sb.from("bots").select("*", { count: "exact", head: true }).eq("chat_enabled", true);
    console.log(`  chat_enabled bots: ${enabledCount}`);
  } else {
    console.log("\n✗ Messages were not inserted despite sent > 0 — possible insert error");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
