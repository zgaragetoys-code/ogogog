/**
 * Backfill: creates a profiles row for every auth user that doesn't have one.
 * Idempotent — uses upsert with onConflict: 'id', so re-running is safe.
 *
 * Usage: npx tsx --env-file=.env.local scripts/backfill-profiles.ts
 */

import { createClient } from "@supabase/supabase-js";

const STYLES = [
  "adventurer", "avataaars", "bottts", "fun-emoji", "identicon",
  "lorelei", "pixel-art", "shapes", "thumbs", "big-smile",
] as const;

function randomStyle() {
  return STYLES[Math.floor(Math.random() * STYLES.length)];
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Fetch all auth users (service role required)
  const { data: usersData, error: usersError } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw new Error(`listUsers: ${usersError.message}`);
  const users = usersData.users;
  console.log(`Auth users found: ${users.length}`);

  // 2. Fetch existing profile IDs
  const { data: profiles, error: profilesError } = await sb.from("profiles").select("id");
  if (profilesError) throw new Error(`select profiles: ${profilesError.message}`);
  const existing = new Set((profiles ?? []).map((p: { id: string }) => p.id));
  console.log(`Existing profile rows: ${existing.size}`);

  // 3. Build rows for missing users
  const missing = users.filter((u) => !existing.has(u.id));
  console.log(`Users without profiles: ${missing.length}`);

  if (missing.length > 0) {
    // Try with new columns first (post-migration-005); fall back to id-only if columns missing
    const fullRows = missing.map((u) => ({ id: u.id, avatar_seed: u.id, avatar_style: randomStyle() }));
    const { error: fullError } = await sb.from("profiles").upsert(fullRows, { onConflict: "id" });

    if (fullError) {
      console.log(`Note: new profile columns not yet present (${fullError.message}). Inserting id-only.`);
      const minimalRows = missing.map((u) => ({ id: u.id }));
      const { error: minError } = await sb.from("profiles").upsert(minimalRows, { onConflict: "id" });
      if (minError) throw new Error(`upsert (minimal): ${minError.message}`);
    }

    console.log(`Created ${missing.length} missing profile row(s).`);
  } else {
    console.log("All users already have profiles — nothing to insert.");
  }

  // 4. Report the target user's profile row
  const TARGET_EMAIL = "jokey56.sz@gmail.com";
  const targetUser = users.find((u) => u.email === TARGET_EMAIL);
  if (!targetUser) {
    console.log(`\nCould not find user with email ${TARGET_EMAIL}`);
    return;
  }

  const { data: row, error: rowError } = await sb
    .from("profiles")
    .select("*")
    .eq("id", targetUser.id)
    .maybeSingle();

  if (rowError) throw new Error(`select profile row: ${rowError.message}`);
  console.log(`\nProfile row for ${TARGET_EMAIL}:`);
  console.log(JSON.stringify(row, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
