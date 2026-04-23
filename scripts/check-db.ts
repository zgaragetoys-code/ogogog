import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all active listings with card details
  const { data: listings } = await supabase
    .from("listings")
    .select("id, card_id, user_id, listing_type, status")
    .eq("status", "active");

  const cardIds = [...new Set(listings?.map(l => l.card_id).filter(Boolean) as string[])];

  // Get card details including image_url
  const { data: cards } = await supabase
    .from("cards")
    .select("id, name, set_name, image_url")
    .in("id", cardIds);

  const cardMap = new Map(cards?.map(c => [c.id, c]) ?? []);

  console.log(`\n${listings?.length ?? 0} active listings:\n`);
  listings?.forEach(l => {
    const card = l.card_id ? cardMap.get(l.card_id) : null;
    const hasImg = card?.image_url ? "✓ IMG" : "✗ NO IMG";
    console.log(`  ${hasImg} | ${card?.name ?? l.card_id ?? "custom"} (${card?.set_name ?? ""}) | ${l.listing_type}`);
  });

  // Count cards with no working image
  const noImgCount = listings?.filter(l => {
    if (!l.card_id) return true;
    const card = cardMap.get(l.card_id);
    return !card?.image_url;
  }).length ?? 0;
  console.log(`\n${noImgCount} listings without image_url in DB`);

  // Get profiles to map user_id to username
  const userIds = [...new Set(listings?.map(l => l.user_id) ?? [])];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);
  const profileMap = new Map(profiles?.map(p => [p.id, p.username]) ?? []);
  console.log("\nListings by user:");
  const byUser = new Map<string, number>();
  listings?.forEach(l => {
    const u = profileMap.get(l.user_id) ?? l.user_id.slice(0, 8);
    byUser.set(u, (byUser.get(u) ?? 0) + 1);
  });
  byUser.forEach((count, user) => console.log(`  ${user}: ${count} listings`));
}

main().catch(console.error);
