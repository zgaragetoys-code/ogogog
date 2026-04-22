/**
 * Phase 1 import: pulls all sets and basic card info from TCGdex into Supabase.
 *
 * Run with:  npm run import:tcgdex
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Get it from: Supabase dashboard → Project Settings → API → service_role key
 *
 * Safe to re-run — all inserts are upserts (won't create duplicates).
 */

import TCGdex from "@tcgdex/sdk";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// ----------------------------------------------------------------
// Validate env
// ----------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "\nMissing environment variables. Make sure .env.local contains:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY\n"
  );
  process.exit(1);
}

// Service role key bypasses RLS — safe here because this script only
// runs locally and is never deployed.
const supabase = createClient(supabaseUrl, serviceRoleKey);
const tcgdex = new TCGdex("en");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cardImageUrl(base: string | undefined): string | null {
  return base ? `${base}/high.webp` : null;
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------

async function main() {
  console.log("Fetching set list from TCGdex...");
  const setList = await tcgdex.fetchSets();

  if (!setList?.length) {
    console.error("No sets returned — check your internet connection.");
    process.exit(1);
  }

  console.log(`Found ${setList.length} sets. Starting import...\n`);

  let importedCards = 0;
  let skippedSets = 0;

  for (let i = 0; i < setList.length; i++) {
    const resume = setList[i];
    const tag = `[${String(i + 1).padStart(3, "0")}/${setList.length}]`;

    const set = await tcgdex.fetchSet(resume.id);

    if (!set) {
      console.warn(`${tag} SKIP   ${resume.id} — fetch failed`);
      skippedSets++;
      continue;
    }

    const cards = set.cards ?? [];

    if (cards.length === 0) {
      console.log(`${tag} EMPTY  ${set.name} (${set.id})`);
      continue;
    }

    // Build one flat row per card — set info denormalized onto each row
    const rows = cards.map((card) => ({
      id:           card.id,
      name:         card.name,
      set_name:     set.name,
      set_code:     set.id,
      card_number:  card.localId,
      image_url:    cardImageUrl(card.image),
      release_date: set.releaseDate ?? null,
      language:     "en",
      product_type: "single_card",
      // rarity comes from individual card fetch (Phase 2 enrichment)
    }));

    // Upsert in batches of 500 (Supabase request limit)
    const BATCH = 500;
    let batchFailed = false;

    for (let b = 0; b < rows.length; b += BATCH) {
      const { error } = await supabase
        .from("cards")
        .upsert(rows.slice(b, b + BATCH));

      if (error) {
        console.error(`${tag} ERROR  ${set.id} — ${error.message}`);
        batchFailed = true;
        break;
      }
    }

    if (!batchFailed) {
      importedCards += rows.length;
      console.log(`${tag} OK     ${set.name} — ${rows.length} cards`);
    }

    await sleep(80); // ~12 req/s, polite to the free API
  }

  console.log(`
Import complete
  Sets:  ${setList.length - skippedSets} processed, ${skippedSets} skipped
  Cards: ${importedCards} imported

Note: rarity, category, types, and hp are null for all cards.
These require individual card fetches (Phase 2 enrichment — run separately).
`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
