/**
 * Creates a fully populated test user: testest123
 * Email: testest123@example.com  Password: testest321
 *
 * Run with: npm run seed:testuser
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = "testest123@example.com";
const TEST_PASSWORD = "testest321";

async function main() {
  console.log("→ Creating test user account...");

  // Check if user already exists
  const { data: existingList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = existingList?.users?.find(u => u.email === TEST_EMAIL);

  let userId: string;

  if (existing) {
    console.log(`  User already exists (${existing.id}) — reusing`);
    userId = existing.id;
    // Reset password
    await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      console.error("  Failed to create user:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`  Created user ${userId}`);
  }

  // Grab 12 random card IDs (single cards for listings, various for collection)
  const { data: cardPool } = await admin
    .from("cards")
    .select("id, name, set_name, product_type")
    .eq("product_type", "single_card")
    .order("id")
    .limit(500);

  if (!cardPool || cardPool.length < 12) {
    console.error("  Not enough cards in DB. Run import:tcgdex first.");
    process.exit(1);
  }

  const pick = (n: number, offset = 0) =>
    cardPool.slice(offset, offset + n);

  const listingCards = pick(5, 0);
  const wantedCards = pick(3, 5);
  const collectionCards = pick(20, 8);

  // Profile
  console.log("→ Setting up profile...");
  await admin.from("profiles").upsert({
    id: userId,
    username: "testest123",
    display_name: "Testy McTestface",
    avatar_seed: "testest123-seed",
    avatar_style: "avataaars",
    country: "US",
    region: "California",
    notes: "I'm a test user created by the admin seed script. Looking for good deals on rare cards!",
    discord_username: "testest123#0000",
    ebay_username: "testest_buyer",
  });

  // For-sale listings
  console.log("→ Creating for-sale listings...");
  const forSalePayloads = listingCards.map((card, i) => ({
    user_id: userId,
    card_id: card.id,
    listing_type: "for_sale" as const,
    status: "active" as const,
    condition_type: "raw" as const,
    raw_condition: (["NM", "LP", "MP", "NM", "NM"] as const)[i],
    price_type: (["firm", "obo", "obo", "obo", "firm"] as const)[i],
    price: [12.99, 8.50, 3.25, 6.00, 45.00][i],
    notes: [
      "Great condition, pulled from a booster pack. Happy to combine shipping!",
      "Minor edge wear but overall solid. Will consider reasonable offers.",
      "Decent card, looking to free up collection space.",
      "Open to trades or cash. Let me know what you have.",
      "Mint pull, no whitening on the back. Serious buyers only.",
    ][i],
    is_featured: i === 0,
    featured_until: i === 0 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
  }));

  const { error: listingErr } = await admin.from("listings").insert(forSalePayloads);
  if (listingErr) console.warn("  Listings insert warning:", listingErr.message);
  else console.log(`  Created ${forSalePayloads.length} for-sale listings`);

  // Wanted listings
  console.log("→ Creating wanted listings...");
  const wantedPayloads = wantedCards.map((card, i) => ({
    user_id: userId,
    card_id: card.id,
    listing_type: "wanted" as const,
    status: "active" as const,
    condition_type: "raw" as const,
    raw_condition: "NM" as const,
    price_type: "obo" as const,
    price: [5.00, 15.00, 25.00][i],
    notes: [
      "Looking for this for my binder. NM only please.",
      "Completing my set — budget is flexible for the right copy.",
      "Have been hunting this one for a while!",
    ][i],
  }));

  const { error: wantedErr } = await admin.from("listings").insert(wantedPayloads);
  if (wantedErr) console.warn("  Wanted listings warning:", wantedErr.message);
  else console.log(`  Created ${wantedPayloads.length} wanted listings`);

  // Custom listing (accessories/storage)
  console.log("→ Creating custom listing...");
  const { error: customErr } = await admin.from("custom_listings").insert({
    user_id: userId,
    title: "Ultra Pro 9-Pocket Binder (Black) — Like New",
    description: "Barely used Ultra Pro binder. Holds 360 cards in 9-pocket sleeves. No marks or scratches. Perfect for organizing your collection.",
    custom_category: "storage",
    condition_generic: "like_new",
    listing_type: "for_sale",
    price_type: "firm",
    price: 9.99,
    notes: "Local pickup preferred but will ship with buyer paying shipping.",
    status: "active",
    is_featured: false,
  });
  if (customErr) console.warn("  Custom listing warning:", customErr.message);
  else console.log("  Created 1 custom listing");

  // Collection items
  console.log("→ Building collection...");
  const collectionPayloads = collectionCards.map((card, i) => ({
    user_id: userId,
    card_id: card.id,
    quantity: [1, 2, 1, 3, 1, 1, 2, 1, 1, 4, 1, 1, 2, 1, 1, 1, 1, 3, 1, 2][i] ?? 1,
    for_sale: i < 3,
    condition_type: i % 3 === 0 ? "graded" : "raw",
    raw_condition: i % 3 !== 0 ? (["NM", "LP", "NM", "MP", "NM", "NM", "LP", "NM", "NM", "NM", "NM", "NM", "LP", "NM"][i] ?? "NM") : null,
    grading_company: i % 3 === 0 ? "PSA" : null,
    grade: i % 3 === 0 ? [9, 10, 8, 9, 10][Math.floor(i / 3)] ?? 9 : null,
    notes: i === 0 ? "PSA 9 — beautiful card" : null,
  }));

  // Remove duplicates by card_id just in case the pool has overlaps
  const seen = new Set<string>();
  const deduped = collectionPayloads.filter(p => {
    if (seen.has(p.card_id)) return false;
    seen.add(p.card_id);
    return true;
  });

  const { error: collErr } = await admin.from("collection_items").upsert(deduped, {
    onConflict: "user_id,card_id",
    ignoreDuplicates: true,
  });
  if (collErr) console.warn("  Collection warning:", collErr.message);
  else console.log(`  Added ${deduped.length} items to collection`);

  console.log("\n✅ Done!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  Profile:  testest123 / Testy McTestface`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nYou can now message this user from the admin account.");
  console.log("Find their listings in Browse or visit their profile page.");
}

main().catch(e => { console.error(e); process.exit(1); });
