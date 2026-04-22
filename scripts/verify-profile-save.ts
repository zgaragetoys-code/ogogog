/**
 * Verifies the full profile save path end-to-end using the service role key.
 * Run after migration 006 is applied.
 *
 * Usage: npx tsx --env-file=.env.local scripts/verify-profile-save.ts
 */

import { createClient } from "@supabase/supabase-js";

const USER_ID = "764c9b7c-6b12-42b0-87a2-e17310e01b1a";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("1. Reading current profile row...");
  const { data: before, error: readErr } = await sb
    .from("profiles")
    .select("id, username, display_name, avatar_seed, avatar_style, country, region, notes")
    .eq("id", USER_ID)
    .maybeSingle();

  if (readErr) {
    console.error("Read failed:", readErr.message, readErr.code);
    console.error("PostgREST schema cache is still stale — run migration 006 first.");
    process.exit(1);
  }
  console.log("Before:", JSON.stringify(before, null, 2));

  console.log("\n2. Updating profile with test values...");
  const { error: updateErr } = await sb
    .from("profiles")
    .update({
      username: "testuser_verify",
      display_name: "Verify Test",
      avatar_seed: USER_ID,
      avatar_style: "bottts",
      country: "US",
      region: "California",
      notes: "Verification test — will be cleared.",
    })
    .eq("id", USER_ID);

  if (updateErr) {
    console.error("Update failed:", updateErr.message, updateErr.code, updateErr.details);
    process.exit(1);
  }
  console.log("Update succeeded.");

  console.log("\n3. Reading back to confirm persistence...");
  const { data: after, error: readErr2 } = await sb
    .from("profiles")
    .select("id, username, display_name, avatar_seed, avatar_style, country, region, notes")
    .eq("id", USER_ID)
    .maybeSingle();

  if (readErr2) {
    console.error("Read-back failed:", readErr2.message);
    process.exit(1);
  }
  console.log("After:", JSON.stringify(after, null, 2));

  // Verify values persisted
  const ok =
    after?.username === "testuser_verify" &&
    after?.display_name === "Verify Test" &&
    after?.avatar_style === "bottts" &&
    after?.country === "US" &&
    after?.notes === "Verification test — will be cleared.";

  if (!ok) {
    console.error("\nVERIFICATION FAILED — values did not persist as expected.");
    process.exit(1);
  }

  console.log("\n4. Clearing test values (resetting username/display_name/notes)...");
  const { error: clearErr } = await sb
    .from("profiles")
    .update({ username: null, display_name: null, notes: null })
    .eq("id", USER_ID);

  if (clearErr) {
    console.error("Clear failed:", clearErr.message);
  }

  console.log("\n✓ Profile save is working end-to-end. Ready for browser testing.");
}

main().catch(e => { console.error(e); process.exit(1); });
