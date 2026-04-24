import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROD = "https://ogogog.vercel.app";

async function check(label: string, pass: boolean, note?: string) {
  const icon = pass ? "✓" : "✗";
  console.log(`  ${icon} ${label}${note ? `  (${note})` : ""}`);
  return pass;
}

async function main() {
  let failures = 0;

  // ── CONTENT ────────────────────────────────────────────────────────────────
  console.log("\n[Content — site looks alive]");

  const { count: activeListings } = await sb
    .from("listings").select("*", { count: "exact", head: true }).eq("status", "active");
  if (!await check("Active listings exist", (activeListings ?? 0) > 0, `${activeListings} active`)) failures++;

  const { count: forSale } = await sb
    .from("listings").select("*", { count: "exact", head: true }).eq("listing_type", "for_sale").eq("status", "active");
  const { count: wanted } = await sb
    .from("listings").select("*", { count: "exact", head: true }).eq("listing_type", "wanted").eq("status", "active");
  await check(`  for_sale listings`, (forSale ?? 0) > 0, `${forSale}`);
  await check(`  wanted listings`, (wanted ?? 0) > 0, `${wanted}`);

  const { count: boardPosts } = await sb
    .from("board_posts").select("*", { count: "exact", head: true }).is("deleted_at", null);
  if (!await check("Board has posts", (boardPosts ?? 0) > 0, `${boardPosts} posts`)) failures++;

  const { count: chatMsgs } = await sb
    .from("global_chat_messages").select("*", { count: "exact", head: true }).is("deleted_at", null);
  if (!await check("Chat has messages", (chatMsgs ?? 0) > 0, `${chatMsgs} messages`)) failures++;

  // ── AUTH FLOW ──────────────────────────────────────────────────────────────
  console.log("\n[Auth Flow]");

  const loginPage = await fetch(`${PROD}/auth/login`, { redirect: "manual" });
  await check("Login page loads", loginPage.status === 200);

  const signupPage = await fetch(`${PROD}/auth/signup`, { redirect: "manual" });
  await check("Signup page loads", signupPage.status === 200);

  const callbackNoCode = await fetch(`${PROD}/auth/callback`, { redirect: "manual" });
  await check("Auth callback handles no code gracefully", [200, 307, 302].includes(callbackNoCode.status));

  // ── KEY PAGES ──────────────────────────────────────────────────────────────
  console.log("\n[Key Pages]");

  const pages = [
    ["/browse", "Browse feed"],
    ["/featured", "Featured listings"],
    ["/board", "Discussion board"],
    ["/feature-your-listing", "Feature your listing CTA"],
    ["/how-it-works", "How it works"],
  ] as const;

  for (const [path, label] of pages) {
    const res = await fetch(`${PROD}${path}`, { redirect: "manual" });
    if (!await check(label, res.status === 200)) failures++;
  }

  // ── USER PROFILES ──────────────────────────────────────────────────────────
  console.log("\n[Community Profiles publicly accessible]");

  const communityUsers = ["jordancollects", "karentradesvtg", "sealedvault", "pixelpokemon88", "nightshadecards"];
  for (const username of communityUsers) {
    const res = await fetch(`${PROD}/u/${username}`, { redirect: "manual" });
    if (!await check(`/u/${username}`, res.status === 200)) failures++;
  }

  // ── LISTING DETAIL ─────────────────────────────────────────────────────────
  console.log("\n[Listing Detail]");

  const { data: sampleListing } = await sb
    .from("listings").select("id").eq("status", "active").limit(1).single();

  if (sampleListing) {
    const res = await fetch(`${PROD}/listings/${sampleListing.id}`, { redirect: "manual" });
    if (!await check(`/listings/${sampleListing.id.slice(0, 8)}… loads`, res.status === 200)) failures++;
  } else {
    console.log("  ⚠ No active listings to test detail page with");
  }

  // ── SECURITY ───────────────────────────────────────────────────────────────
  console.log("\n[Security]");

  const adminNoAuth = await fetch(`${PROD}/admin/bots`, { redirect: "manual" });
  if (!await check("Admin requires auth (redirects)", adminNoAuth.status === 307)) failures++;

  const tickNoSecret = await fetch(`${PROD}/api/bots/tick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: 1 }),
  });
  if (!await check("Bot tick requires secret (401)", tickNoSecret.status === 401)) failures++;

  // ── SEO / META ─────────────────────────────────────────────────────────────
  console.log("\n[SEO / Meta]");

  const browseHtml = await fetch(`${PROD}/browse`).then(r => r.text());
  await check("Browse page has <title>", browseHtml.includes("<title>"));
  await check("Browse page has meta description", browseHtml.includes('name="description"') || browseHtml.includes('og:description'));
  await check("No console errors in HTML source", !browseHtml.includes("Error:") && !browseHtml.includes("TypeError"));

  // ── BOT ACTIVITY ───────────────────────────────────────────────────────────
  console.log("\n[Bot Activity]");

  const { count: enabledBots } = await sb
    .from("bots").select("*", { count: "exact", head: true }).eq("chat_enabled", true);
  await check(`Chat-enabled bots ready`, (enabledBots ?? 0) > 0, `${enabledBots} bots`);

  const { count: recentBotMsgs } = await sb
    .from("global_chat_messages")
    .select("*", { count: "exact", head: true })
    .not("bot_id", "is", null)
    .is("deleted_at", null)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  await check("Bot messages sent in last 24h", (recentBotMsgs ?? 0) > 0, `${recentBotMsgs} messages`);

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  if (failures === 0) {
    console.log("✓ FINAL CHECK PASSED — site is ready to share");
  } else {
    console.log(`✗ ${failures} issue(s) need attention before launch`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
