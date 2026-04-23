/**
 * Fills in missing card images using the pokemontcg.io API.
 *
 * Targets cards where image_url IS NULL in our database.
 * Matches by card name + set name similarity, then updates image_url.
 *
 * Run with: npm run enrich:images
 *
 * Safe to re-run — only updates cards that still have null image_url.
 * Rate-limited: no API key needed, but uses sleep between requests.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PTCGIO_BASE = "https://api.pokemontcg.io/v2";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // Count common characters
  const setA = new Set(na.split(""));
  const setB = new Set(nb.split(""));
  const intersection = [...setA].filter((c) => setB.has(c)).length;
  return intersection / Math.max(setA.size, setB.size);
}

interface PtcgCard {
  id: string;
  name: string;
  number: string;
  set: { id: string; name: string };
  images: { small: string; large: string };
}

async function fetchPtcgCards(name: string): Promise<PtcgCard[]> {
  const escaped = name.replace(/['"]/g, "");
  const url = `${PTCGIO_BASE}/cards?q=name:"${encodeURIComponent(escaped)}"&pageSize=50&select=id,name,number,set,images`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { data: PtcgCard[] };
  return json.data ?? [];
}

async function main() {
  console.log("Fetching cards with missing images from Supabase...");

  const { data: missing, error } = await supabase
    .from("cards")
    .select("id, name, set_name, card_number, set_code")
    .is("image_url", null)
    .order("id");

  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  if (!missing?.length) {
    console.log("No cards with null image_url. Nothing to do.");
    return;
  }

  console.log(`Found ${missing.length} cards missing images. Enriching...\n`);

  let updated = 0;
  let skipped = 0;
  const checked = new Set<string>(); // avoid re-fetching same name

  for (const card of missing) {
    const cacheKey = card.name.toLowerCase();
    let candidates: PtcgCard[] = [];

    if (!checked.has(cacheKey)) {
      candidates = await fetchPtcgCards(card.name);
      checked.add(cacheKey);
      await sleep(100); // ~10 req/s
    } else {
      // Already fetched for this name, fetch again (cache missed due to simplicity)
      candidates = await fetchPtcgCards(card.name);
      await sleep(100);
    }

    if (!candidates.length) {
      console.log(`  SKIP   ${card.id} — no results on pokemontcg.io for "${card.name}"`);
      skipped++;
      continue;
    }

    // Find best match: same card number + highest set name similarity
    const byNumber = candidates.filter(
      (c) => c.number === card.card_number || c.number === String(parseInt(card.card_number))
    );

    const pool = byNumber.length ? byNumber : candidates;
    const ranked = pool
      .map((c) => ({ c, score: similarity(c.set.name, card.set_name) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score < 0.4) {
      console.log(`  SKIP   ${card.id} — no confident match for "${card.name}" / "${card.set_name}"`);
      skipped++;
      continue;
    }

    const imageUrl = best.c.images.large ?? best.c.images.small;
    if (!imageUrl) {
      console.log(`  SKIP   ${card.id} — pokemontcg.io matched but no image URL`);
      skipped++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("cards")
      .update({ image_url: imageUrl })
      .eq("id", card.id);

    if (updateErr) {
      console.log(`  ERROR  ${card.id} — ${updateErr.message}`);
      skipped++;
    } else {
      console.log(`  OK     ${card.id} (${card.name}) → ${imageUrl.slice(0, 60)}...`);
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
