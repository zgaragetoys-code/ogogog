import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(email: string): Promise<string | null> {
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.error("Failed to list users:", error.message); return null; }
  const user = data?.users?.find((u) => u.email === email);
  if (!user) { console.error(`User not found: ${email}`); return null; }
  return user.id;
}

const now = Date.now();
const m = (mins: number) => new Date(now - mins * 60000).toISOString();

type PostTemplate = { email: string; post_type: string; created_at: string; content: string };

const POST_TEMPLATES: PostTemplate[] = [
  // ── Buying posts ──────────────────────────────────────────────────────────
  { email: "jordan.collectsptcg@gmail.com",  post_type: "buying",      created_at: m(180),
    content: "Looking to buy NM or better 1st Edition Base Set singles. Not chasing Charizard specifically — want Venusaur, Blastoise, Clefairy, Chansey. Paying fair market. DM me with what you have." },
  { email: "nightshade.cards@proton.me",     post_type: "buying",      created_at: m(155),
    content: "Buying PSA 9 and PSA 10 slabs only. Currently hunting: Neo Genesis Lugia, Gold Star Rayquaza, Shining Charizard. Budget is flexible for the right cards. Serious inquiries only." },
  { email: "karentradesvtg@outlook.com",     post_type: "buying",      created_at: m(130),
    content: "In the market for competitive staples — need 4x Iono, 2x Pidgeot ex, 3x Boss's Orders (Geeta). Buying or trading. Have excess from Twilight Masquerade to offer." },
  { email: "pixelpokemon88@gmail.com",        post_type: "buying",      created_at: m(90),
    content: "First time buyer here! Looking for affordable starter sets — any base set unlimited commons/uncommons in LP or better. Learning the hobby, budget around $20-30 total. Happy to bundle." },
  { email: "sealedvault.ptcg@gmail.com",      post_type: "buying",      created_at: m(60),
    content: "Buying sealed in bulk. ETBs, booster boxes, case quantities from any set 2019–2023. Must be factory sealed with shrink intact. Will pay promptly via PayPal G&S. Preferred: Sword & Shield era." },

  // ── Selling posts ─────────────────────────────────────────────────────────
  { email: "jordan.collectsptcg@gmail.com",  post_type: "selling",     created_at: m(170),
    content: "Clearing out duplicates from my vintage collection. Have: 1st Ed Jungle Electrode (NM), Fossil Gengar holo (LP), Base Unlimited Raichu (NM). All priced below market. Listings are up." },
  { email: "nightshade.cards@proton.me",     post_type: "selling",     created_at: m(120),
    content: "Moving some slabs to fund a grail purchase. PSA 8 Jungle Vaporeon, CGC 9 Fossil Zapdos, PSA 7 Team Rocket Dark Charizard. All pop report verified. Prices in listings, open to reasonable offers." },
  { email: "karentradesvtg@outlook.com",     post_type: "selling",     created_at: m(80),
    content: "Selling competitive singles — finished with the Gardevoir build. Have full playset of everything. Prefer to sell as a bundle but will split. Check my listings for pricing." },

  // ── Trading posts ─────────────────────────────────────────────────────────
  { email: "pixelpokemon88@gmail.com",        post_type: "trading",     created_at: m(145),
    content: "Want to trade! Have: Scarlet & Violet era holos I pulled from packs, mostly modern alt arts. Want: anything from Sword & Shield Vivid Voltage or Chilling Reign. Happy to add cash on my side to even it up." },
  { email: "karentradesvtg@outlook.com",     post_type: "trading",     created_at: m(100),
    content: "Trading my extra Twilight Masquerade pulls for Temporal Forces singles I still need. DM me your TF haves list. Especially want Iron Crown ex and Teal Mask Ogerpon ex." },
  { email: "jordan.collectsptcg@gmail.com",  post_type: "trading",     created_at: m(50),
    content: "Trade offer: my LP Fossil Raichu holo straight across for a NM Base Unlimited Electabuzz holo. Both raw. Trying to complete my type collection without spending more cash. Anyone?" },

  // ── Looking for posts ─────────────────────────────────────────────────────
  { email: "sealedvault.ptcg@gmail.com",      post_type: "looking_for", created_at: m(160),
    content: "Looking for: sealed Vivid Voltage booster box with intact shrink. Checked eBay and prices are stupid right now. If anyone grabbed an extra at retail and is willing to let it go at a fair price, let me know." },
  { email: "nightshade.cards@proton.me",     post_type: "looking_for", created_at: m(110),
    content: "Hunting a specific card: Gym Challenge Blaine's Charizard holo, NM or better raw. It's for a submission batch. Pop on PSA 10 is under 20. If you have one sitting in a binder please reach out." },
  { email: "pixelpokemon88@gmail.com",        post_type: "looking_for", created_at: m(70),
    content: "Looking for anyone who knows where to find team bags and card savers locally in the Seattle area. Online shipping is killing me for small quantities. Or just DM me your preferred online source." },

  // ── General posts ─────────────────────────────────────────────────────────
  { email: "jordan.collectsptcg@gmail.com",  post_type: "general",     created_at: m(140),
    content: "Heads up for vintage collectors: the Jungle set is having a quiet moment right now. Holo prices are softer than they've been in 2 years. If you've been waiting to entry, this might be the window." },
  { email: "karentradesvtg@outlook.com",     post_type: "general",     created_at: m(115),
    content: "Reminder that PayPal G&S is the only safe way to send money for card purchases. Friends & Family has zero buyer protection. Always G&S, always." },
  { email: "sealedvault.ptcg@gmail.com",      post_type: "general",     created_at: m(95),
    content: "PSA turnaround is back down to 45 days on bulk tier. Just got a batch back. If you've been holding off on submitting, now's a decent time." },
  { email: "nightshade.cards@proton.me",     post_type: "general",     created_at: m(75),
    content: "Reminder: always check the pop report before paying a premium for a card. A PSA 9 with a pop of 400 is very different from one with a pop of 12. Price accordingly." },
  { email: "pixelpokemon88@gmail.com",        post_type: "general",     created_at: m(40),
    content: "New to the hobby question: is there any difference between buying singles here vs TCGplayer? Asking because I'm not sure if local is better for vintage stuff. Thanks in advance." },
  { email: "jordan.collectsptcg@gmail.com",  post_type: "general",     created_at: m(20),
    content: "Anyone going to regionals in the next few months? Would love to coordinate a meetup. Always good to put faces to usernames and maybe do some in-person trades." },
  { email: "karentradesvtg@outlook.com",     post_type: "general",     created_at: m(10),
    content: "Just finished reorganizing my binder by set and year. Took a whole weekend but honestly it's so much better. Highly recommend if you're still doing it alphabetically by name." },
];

async function main() {
  console.log("Resolving community user IDs…");

  // Build email→uuid map by looking up actual auth users
  const emails = [...new Set(POST_TEMPLATES.map(p => p.email))];
  const idMap = new Map<string, string>();
  for (const email of emails) {
    const id = await getUserId(email);
    if (id) { idMap.set(email, id); console.log(`  ${email} → ${id}`); }
  }

  if (idMap.size === 0) {
    console.error("\nNo community users found. Run npm run seed:community first.");
    process.exit(1);
  }

  // Check for existing posts to avoid duplicates
  const { count: existing } = await sb
    .from("board_posts")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if ((existing ?? 0) >= POST_TEMPLATES.length) {
    console.log(`\nAlready have ${existing} board posts. Skipping.`);
    return;
  }

  console.log(`\nInserting ${POST_TEMPLATES.length} board posts…`);
  let ok = 0, fail = 0;

  for (const post of POST_TEMPLATES) {
    const userId = idMap.get(post.email);
    if (!userId) { console.error(`✗ No ID for ${post.email}`); fail++; continue; }

    const { error } = await sb.from("board_posts").insert({
      user_id:    userId,
      content:    post.content,
      post_type:  post.post_type,
      created_at: post.created_at,
    });

    if (error) { console.error("✗", post.content.slice(0, 50), "—", error.message); fail++; }
    else ok++;
  }

  console.log(`\nDone. ${ok} inserted, ${fail} failed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
