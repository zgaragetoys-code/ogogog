/**
 * Seeds 5 realistic community users with listings, collections, and profiles.
 *
 * These are long-lived demo/community accounts to make the site feel populated.
 * Run with: npm run seed:community
 *
 * Safe to re-run — upserts profiles and collection items, skips users that exist.
 * Listings are only created if the user has zero active listings.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Community members ────────────────────────────────────────────────────────

const USERS = [
  {
    email: "jordan.collectsptcg@gmail.com",
    password: "JordanPTCG#2024",
    profile: {
      username: "jordancollects",
      display_name: "Jordan M.",
      avatar_style: "adventurer",
      avatar_seed: "jordan-seed-001",
      country: "US",
      region: "Oregon",
      notes:
        "Vintage collector based in Portland. Mainly Base Set through Neo. " +
        "All cards stored in perfect-fit sleeves and binders from day one. " +
        "Happy to combine shipping — ask me anything.",
      ebay_username: "jordan_ptcg_pdx",
      discord_username: "jordanpdx#4821",
    },
  },
  {
    email: "karentradesvtg@outlook.com",
    password: "KarenPTCG#2024",
    profile: {
      username: "karentradesvtg",
      display_name: "Karen C.",
      avatar_style: "lorelei",
      avatar_seed: "karen-seed-002",
      country: "CA",
      region: "British Columbia",
      notes:
        "Competitive player and trader from Vancouver. " +
        "Looking for tournament staples and will pay fair market. " +
        "Fast shipper — usually same or next business day.",
      tcgplayer_url: "https://www.tcgplayer.com/search/all/product?seller=karentradesvtg",
      discord_username: "KarenC_BC#3310",
    },
  },
  {
    email: "sealedvault.ptcg@gmail.com",
    password: "SealedPTCG#2024",
    profile: {
      username: "sealedvault",
      display_name: "Marcus W.",
      avatar_style: "bottts",
      avatar_seed: "marcus-seed-003",
      country: "GB",
      region: "Manchester",
      notes:
        "Sealed product specialist. ETBs, booster boxes, tins — if it's sealed I probably have it or want it. " +
        "Ship internationally. All items shipped in bubble wrap inside a box.",
      ebay_username: "sealed_vault_uk",
      website_url: "https://www.instagram.com/sealedvaultptcg",
    },
  },
  {
    email: "pixelpokemon88@gmail.com",
    password: "PixelPTCG#2024",
    profile: {
      username: "pixelpokemon88",
      display_name: "Sam R.",
      avatar_style: "pixel-art",
      avatar_seed: "sam-seed-004",
      country: "US",
      region: "Texas",
      notes:
        "Casual collector from Austin TX. Grew up with the original sets and still love opening packs. " +
        "Budget-friendly prices, no low-ballers please.",
      instagram_url: "https://www.instagram.com/pixelpokemon88",
      discord_username: "PixelSam88#7761",
    },
  },
  {
    email: "nightshade.cards@proton.me",
    password: "NightPTCG#2024",
    profile: {
      username: "nightshadecards",
      display_name: "Alex P.",
      avatar_style: "shapes",
      avatar_seed: "alex-seed-005",
      country: "US",
      region: "California",
      notes:
        "High-end singles collector. PSA 10s and CGC Pristine only. " +
        "Located in the Bay Area. " +
        "Serious inquiries welcome — lowball offers politely declined.",
      tcgplayer_url: "https://www.tcgplayer.com/search/all/product?seller=nightshadecards",
      discord_username: "NightshadeAlex#0001",
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findCards(names: string[]): Promise<Map<string, { id: string; name: string; set_name: string; product_type: string }>> {
  const map = new Map<string, { id: string; name: string; set_name: string; product_type: string }>();
  for (const name of names) {
    const { data } = await admin
      .from("cards")
      .select("id, name, set_name, product_type")
      .ilike("name", name)
      .not("image_url", "is", null)
      .order("release_date", { ascending: true })
      .limit(1);
    if (data?.[0]) map.set(name.toLowerCase(), data[0]);
  }
  return map;
}

async function findCardByNameAndSet(name: string, setName: string) {
  const { data } = await admin
    .from("cards")
    .select("id, name, set_name")
    .ilike("name", name)
    .ilike("set_name", `%${setName}%`)
    .not("image_url", "is", null)
    .limit(1);
  return data?.[0] ?? null;
}

async function getOrCreateUser(email: string, password: string): Promise<string | null> {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) { console.error(`  Failed to create ${email}:`, error.message); return null; }
  return data.user.id;
}

async function hasListings(userId: string): Promise<boolean> {
  const { count } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  return (count ?? 0) > 0;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Loading card catalog…");

  const cardNames = [
    "Charizard", "Blastoise", "Venusaur", "Pikachu", "Mewtwo",
    "Raichu", "Gengar", "Alakazam", "Machamp", "Gyarados",
    "Eevee", "Vaporeon", "Jolteon", "Flareon", "Snorlax",
    "Dragonite", "Arcanine", "Lapras", "Mew", "Lugia",
    "Ho-Oh", "Umbreon", "Espeon", "Tyranitar", "Rayquaza",
    "Garchomp", "Lucario", "Gardevoir", "Darkrai", "Giratina",
  ];

  const cards = await findCards(cardNames);
  console.log(`  Found ${cards.size} cards\n`);

  function card(name: string) {
    return cards.get(name.toLowerCase()) ?? null;
  }

  for (const user of USERS) {
    console.log(`\n── ${user.profile.display_name} (@${user.profile.username})`);

    const userId = await getOrCreateUser(user.email, user.password);
    if (!userId) continue;

    // Profile
    await admin.from("profiles").upsert({ id: userId, ...user.profile });
    console.log(`  Profile: OK`);

    // Skip listings if already seeded
    if (await hasListings(userId)) {
      console.log(`  Listings: already seeded, skipping`);
      continue;
    }

    // ── Listings per user ───────────────────────────────────────────────────

    if (user.profile.username === "jordancollects") {
      const charizard = card("Charizard");
      const blastoise = card("Blastoise");
      const mewtwo = card("Mewtwo");
      const gengar = card("Gengar");
      const raichu = card("Raichu");

      const listings = [
        charizard && {
          user_id: userId, card_id: charizard.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "obo", price: 320.00, is_featured: true,
          featured_until: new Date(Date.now() + 14 * 86400_000).toISOString(),
          notes: "1st Edition shadowless Charizard. Pulled by my dad when the set first came out. " +
                 "Kept in a binder sleeve since day one — no whitening, sharp corners. " +
                 "Looking for OBO, serious offers only. Can ship via tracked insured post.",
        },
        blastoise && {
          user_id: userId, card_id: blastoise.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "LP",
          price_type: "firm", price: 85.00, is_featured: false,
          notes: "Unlimited Base Set Blastoise. Light play — very minor edge wear, no creases. " +
                 "Stored in a sleeve inside a binder. Great card for a vintage collection.",
        },
        mewtwo && {
          user_id: userId, card_id: mewtwo.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "firm", price: 45.00, is_featured: false,
          notes: "Base Set Mewtwo holo. Near Mint — no visible play wear. " +
                 "One of my extras so I can let it go at a fair price.",
        },
        gengar && {
          user_id: userId, card_id: gengar.id, listing_type: "wanted",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "obo", price: 60.00, is_featured: false,
          notes: "Looking for a NM Base Set Fossil Gengar for my binder. " +
                 "Willing to pay up to the listed amount for a truly clean copy.",
        },
        raichu && {
          user_id: userId, card_id: raichu.id, listing_type: "for_sale",
          status: "active", condition_type: "graded", grading_company: "PSA",
          grade: 9, price_type: "firm", price: 110.00, is_featured: false,
          notes: "PSA 9 Base Set Raichu holo. Great eye appeal — centered, glossy. " +
                 "Includes PSA slab. Happy to share photos of the actual slab on request.",
        },
      ].filter(Boolean);

      if (listings.length) {
        await admin.from("listings").insert(listings);
        console.log(`  Listings: ${listings.length} created`);
      }

      // Custom listing
      await admin.from("listings").insert({
        user_id: userId, title: "Ultra Pro 9-Pocket Binder (Blue) — Nearly New",
        listing_type: "for_sale", status: "active",
        custom_category: "storage", condition_generic: "like_new",
        price_type: "firm", price: 12.00,
        notes: "Used for one season. Pockets all intact, no marks. Great for a vintage collection.",
      });
      console.log(`  Custom listing: binder`);

      // Collection
      const collCards = [
        card("Charizard"), card("Blastoise"), card("Venusaur"), card("Mewtwo"),
        card("Pikachu"), card("Raichu"), card("Gengar"), card("Alakazam"),
        card("Machamp"), card("Gyarados"),
      ].filter(Boolean);
      const collItems = collCards.map((c, i) => ({
        user_id: userId, card_id: c!.id, quantity: 1,
        for_sale: i < 3,
        condition_type: "raw",
        raw_condition: (["NM","NM","LP","NM","NM","LP","NM","NM","NM","MP"] as const)[i],
      }));
      await admin.from("collection_items").upsert(collItems, { onConflict: "user_id,card_id", ignoreDuplicates: true });
      console.log(`  Collection: ${collItems.length} cards`);
    }

    if (user.profile.username === "karentradesvtg") {
      const lucario = card("Lucario");
      const gardevoir = card("Gardevoir");
      const garchomp = card("Garchomp");
      const eevee = card("Eevee");
      const umbreon = card("Umbreon");

      const listings = [
        lucario && {
          user_id: userId, card_id: lucario.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "firm", price: 28.00, is_featured: false,
          notes: "Modern Lucario, NM pulled from a booster pack last week. " +
                 "Sleeved immediately. Fast shipping from Vancouver.",
        },
        gardevoir && {
          user_id: userId, card_id: gardevoir.id, listing_type: "wanted",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "obo", price: 35.00, is_featured: false,
          notes: "Looking for a tournament-playable copy. NM or better only please.",
        },
        garchomp && {
          user_id: userId, card_id: garchomp.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "obo", price: 22.00, is_featured: false,
          notes: "Multiple available if you need them for a deck. Can combine shipping.",
        },
        eevee && {
          user_id: userId, card_id: eevee.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "firm", price: 8.50, is_featured: false,
          notes: "NM pull, great artwork. Bulk price if buying more than 3.",
        },
        umbreon && {
          user_id: userId, card_id: umbreon.id, listing_type: "wanted",
          status: "active", condition_type: "graded", grading_company: "PSA",
          grade: 10, price_type: "obo", price: 450.00, is_featured: false,
          notes: "Looking for a PSA 10 Gold Star Umbreon for my PC. " +
                 "Budget is flexible for the right copy. DM me.",
        },
      ].filter(Boolean);

      if (listings.length) {
        await admin.from("listings").insert(listings);
        console.log(`  Listings: ${listings.length} created`);
      }

      const collCards = [
        card("Lucario"), card("Gardevoir"), card("Eevee"), card("Umbreon"),
        card("Espeon"), card("Vaporeon"), card("Jolteon"), card("Flareon"),
      ].filter(Boolean);
      const collItems = collCards.map((c, i) => ({
        user_id: userId, card_id: c!.id, quantity: [2,1,3,1,1,1,1,1][i] ?? 1,
        for_sale: i < 3, condition_type: "raw", raw_condition: "NM" as const,
      }));
      await admin.from("collection_items").upsert(collItems, { onConflict: "user_id,card_id", ignoreDuplicates: true });
      console.log(`  Collection: ${collItems.length} cards`);
    }

    if (user.profile.username === "sealedvault") {
      // Sealed product specialist — mainly custom listings (no card_id)
      const customListings = [
        {
          user_id: userId, listing_type: "for_sale", status: "active",
          title: "Scarlet & Violet Base Set Elite Trainer Box — Factory Sealed",
          custom_category: "sealed_product", condition_generic: "new",
          price_type: "firm", price: 44.99, is_featured: false,
          notes: "Brand new factory sealed. Purchased directly from a game store. " +
                 "Ships double-boxed with padding. UK dispatch, ships worldwide.",
          set_series: "Scarlet & Violet", set_year: 2023,
        },
        {
          user_id: userId, listing_type: "for_sale", status: "active",
          title: "Surging Sparks Booster Box — Sealed",
          custom_category: "sealed_product", condition_generic: "new",
          price_type: "obo", price: 95.00, is_featured: false,
          notes: "Factory sealed booster box, 36 packs. " +
                 "Stored in a cool, dry place away from direct sunlight. Open to reasonable offers.",
          set_series: "Scarlet & Violet", set_year: 2024,
        },
        {
          user_id: userId, listing_type: "for_sale", status: "active",
          title: "Pokémon 151 ETB — Sealed",
          custom_category: "sealed_product", condition_generic: "new",
          price_type: "firm", price: 52.00, is_featured: false,
          notes: "Sealed Pokémon 151 Elite Trainer Box. Perfect condition, no dents or creases on box.",
          set_series: "Scarlet & Violet", set_year: 2023,
        },
        {
          user_id: userId, listing_type: "wanted", status: "active",
          title: "Celebrations Ultra-Premium Collection — Sealed",
          custom_category: "sealed_product", condition_generic: "new",
          price_type: "obo", price: 130.00, is_featured: false,
          notes: "Looking for a sealed UPC. Mint box condition preferred — no dings or tears.",
          set_year: 2021,
        },
        {
          user_id: userId, listing_type: "for_sale", status: "active",
          title: "Twilight Masquerade Tin (Ogerpon) — Factory Sealed",
          custom_category: "sealed_product", condition_generic: "new",
          price_type: "firm", price: 24.99, is_featured: false,
          notes: "Sealed Ogerpon promo tin from Twilight Masquerade. Great gift or PC piece.",
          set_series: "Scarlet & Violet", set_year: 2024,
        },
      ];

      await admin.from("listings").insert(customListings);
      console.log(`  Listings: ${customListings.length} custom sealed listings created`);
    }

    if (user.profile.username === "pixelpokemon88") {
      const pikachu = card("Pikachu");
      const snorlax = card("Snorlax");
      const lapras = card("Lapras");
      const arcanine = card("Arcanine");
      const dragonite = card("Dragonite");

      const listings = [
        pikachu && {
          user_id: userId, card_id: pikachu.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "MP",
          price_type: "firm", price: 4.00, is_featured: false,
          notes: "Played Pikachu from my childhood collection. Some edge wear but still displayable. " +
                 "Great for casual collectors or framing.",
        },
        snorlax && {
          user_id: userId, card_id: snorlax.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "LP",
          price_type: "obo", price: 18.00, is_featured: false,
          notes: "Classic Snorlax. Light play, very presentable. Happy to take offers.",
        },
        lapras && {
          user_id: userId, card_id: lapras.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "NM",
          price_type: "firm", price: 22.00, is_featured: false,
          notes: "NM Lapras from the original set — love this artwork. " +
                 "No issues at all.",
        },
        arcanine && {
          user_id: userId, card_id: arcanine.id, listing_type: "wanted",
          status: "active", condition_type: "any" as never, price_type: "obo", price: 15.00,
          notes: "Looking for an Arcanine to complete my fire-type binder. Any condition welcome.",
        },
        dragonite && {
          user_id: userId, card_id: dragonite.id, listing_type: "for_sale",
          status: "active", condition_type: "raw", raw_condition: "LP",
          price_type: "firm", price: 30.00, is_featured: false,
          notes: "Old Dragonite — favourite Pokémon! Light play. One small nick on the bottom edge.",
        },
      ].filter(Boolean);

      if (listings.length) {
        await admin.from("listings").insert(listings as never[]);
        console.log(`  Listings: ${listings.length} created`);
      }

      // Custom: accessories
      await admin.from("listings").insert([
        {
          user_id: userId, listing_type: "for_sale", status: "active",
          title: "KMC Perfect Fit Sleeves (80ct) — Unopened",
          custom_category: "accessories", condition_generic: "new",
          price_type: "firm", price: 3.50,
          notes: "Unopened pack. Bought extras by mistake.",
        },
        {
          user_id: userId, listing_type: "for_sale", status: "active",
          title: "Dragon Shield Matte Sleeves Blue (100ct) — Unused",
          custom_category: "accessories", condition_generic: "new",
          price_type: "firm", price: 7.00,
          notes: "Bought for a deck build that never happened. Sealed.",
        },
      ]);
      console.log(`  Custom listings: accessories`);

      const collCards = [
        card("Pikachu"), card("Snorlax"), card("Lapras"), card("Arcanine"), card("Dragonite"),
        card("Eevee"), card("Mew"),
      ].filter(Boolean);
      const collItems = collCards.map((c, i) => ({
        user_id: userId, card_id: c!.id, quantity: [3,1,1,2,1,2,1][i] ?? 1,
        for_sale: i < 3, condition_type: "raw" as const, raw_condition: "LP" as const,
      }));
      await admin.from("collection_items").upsert(collItems, { onConflict: "user_id,card_id", ignoreDuplicates: true });
      console.log(`  Collection: ${collItems.length} cards`);
    }

    if (user.profile.username === "nightshadecards") {
      const mewtwo = card("Mewtwo");
      const lugia = card("Lugia");
      const rayquaza = card("Rayquaza");
      const darkrai = card("Darkrai");
      const giratina = card("Giratina");

      const listings = [
        mewtwo && {
          user_id: userId, card_id: mewtwo.id, listing_type: "for_sale",
          status: "active", condition_type: "graded", grading_company: "PSA",
          grade: 10, price_type: "firm", price: 850.00, is_featured: true,
          featured_until: new Date(Date.now() + 30 * 86400_000).toISOString(),
          notes: "PSA 10 Base Set Mewtwo. Gem Mint — perfect centering, full gloss. " +
                 "Comes in a PSA case with a tamper-evident seal. " +
                 "One of the cleanest copies you'll find. Serious offers only.",
        },
        lugia && {
          user_id: userId, card_id: lugia.id, listing_type: "for_sale",
          status: "active", condition_type: "graded", grading_company: "CGC",
          grade: 9.5, price_type: "firm", price: 280.00, is_featured: false,
          notes: "CGC 9.5 Neo Genesis Lugia. Pristine surfaces, excellent centering. " +
                 "Includes CGC slab.",
        },
        rayquaza && {
          user_id: userId, card_id: rayquaza.id, listing_type: "for_sale",
          status: "active", condition_type: "graded", grading_company: "PSA",
          grade: 9, price_type: "obo", price: 190.00, is_featured: false,
          notes: "PSA 9 Rayquaza ex — stunning artwork. Open to fair offers.",
        },
        darkrai && {
          user_id: userId, card_id: darkrai.id, listing_type: "wanted",
          status: "active", condition_type: "graded", grading_company: "PSA",
          grade: 10, price_type: "obo", price: 500.00, is_featured: false,
          notes: "Looking for a PSA 10 Darkrai Gold Star for my personal collection. " +
                 "Budget is there for the right copy.",
        },
        giratina && {
          user_id: userId, card_id: giratina.id, listing_type: "for_sale",
          status: "active", condition_type: "graded", grading_company: "BGS",
          grade: 9.5, price_type: "firm", price: 340.00, is_featured: false,
          notes: "BGS 9.5 Giratina ex special illustration. Quad 9s on the sub-grades. " +
                 "One of the best copies I've had come through.",
        },
      ].filter(Boolean);

      if (listings.length) {
        await admin.from("listings").insert(listings);
        console.log(`  Listings: ${listings.length} created`);
      }

      const collCards = [
        card("Mewtwo"), card("Lugia"), card("Ho-Oh"), card("Rayquaza"),
        card("Darkrai"), card("Giratina"), card("Pikachu"), card("Charizard"),
      ].filter(Boolean);
      const collItems = collCards.map((c, i) => ({
        user_id: userId, card_id: c!.id, quantity: 1,
        for_sale: false,
        condition_type: "graded" as const, grading_company: "PSA" as const,
        grade: [10, 9, 10, 9, 9, 9.5, 10, 9][i] ?? 9,
      }));
      await admin.from("collection_items").upsert(collItems, { onConflict: "user_id,card_id", ignoreDuplicates: true });
      console.log(`  Collection: ${collItems.length} graded slabs`);
    }
  }

  console.log("\n✅ Community seed complete.");
  console.log("\nAccounts:");
  USERS.forEach((u) =>
    console.log(`  @${u.profile.username.padEnd(20)} ${u.email}`)
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
