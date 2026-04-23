import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROFILES = [
  {
    id: "8b5f01d8-a91a-4fc1-a353-7676c0d08201",
    username: "jordancollects",
    display_name: "VintageVault_",
    avatar_style: "adventurer",
    avatar_seed: "vintagevault-x9k",
    country: "US",
    region: "Oregon",
    notes: "Base Set thru Neo era is my whole thing. 1st Ed Shadowless hunting never stops. Everything in penny sleeves day one, stored flat. DM me if you have vintage — I buy, I trade, I hoard lol",
  },
  {
    id: "649efeeb-ac86-4f63-8184-cbcdbc370349",
    username: "karentradesvtg",
    display_name: "GardevoirMain",
    avatar_style: "lorelei",
    avatar_seed: "gardevoirmain-7qr",
    country: "CA",
    region: "British Columbia",
    notes: "Competitive player + trader. If it's a meta staple I probably have 4. Fair trades only, no low offers. Ships next day, bubble mailer + top loader always. Hit me up 🃏",
  },
  {
    id: "febaf952-2a15-435e-adbe-0fe7a0ce9c14",
    username: "sealedvault",
    display_name: "ShrinkWrapKing",
    avatar_style: "bottts",
    avatar_seed: "shrinkwrapking-m3z",
    country: "GB",
    notes: "if it's sealed I either have it or i want it. ETBs, booster boxes, vintage packs — you name it. ship worldwide, always boxed + bubble wrapped. not cracking any of it lmao",
  },
  {
    id: "77c04790-c7fe-483f-b8e5-5bdec66a7b33",
    username: "pixelpokemon88",
    display_name: "PixelPulls",
    avatar_style: "pixel-art",
    avatar_seed: "pixelpulls-4ht",
    country: "US",
    region: "Texas",
    notes: "grew up with gen 1, still collecting. casual vibes only, no drama. budget friendly prices. love finding cool stuff at garage sales and flea markets. Austin TX 🤘",
  },
  {
    id: "b63faca4-0cce-42f1-86b0-40fcceb0ec6c",
    username: "nightshadecards",
    display_name: "SlabGod",
    avatar_style: "shapes",
    avatar_seed: "slabgod-v2w",
    country: "US",
    region: "California",
    notes: "PSA 10s and CGC Pristines only. if the label isn't perfect the card doesn't exist. not here for raw cards. bay area. serious buyers/traders only — lowballs get ignored",
  },
];

async function main() {
  console.log("Updating community profiles to gamer tags…");
  for (const p of PROFILES) {
    const { error } = await sb
      .from("profiles")
      .update({
        display_name: p.display_name,
        avatar_seed:  p.avatar_seed,
        country:      p.country,
        region:       p.region ?? null,
        notes:        p.notes,
      })
      .eq("id", p.id);
    if (error) console.error(`Failed ${p.display_name}:`, error.message);
    else console.log(`✓ ${p.username} → ${p.display_name}`);
  }
  console.log("Done.");
}

main();
