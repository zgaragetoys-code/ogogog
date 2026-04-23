import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const U = {
  jordan:    "8b5f01d8-a91a-4fc1-a353-7676c0d08201",  // VintageVault_
  karen:     "649efeeb-ac86-4f63-8184-cbcdbc370349",   // GardevoirMain
  sealed:    "febaf952-2a15-435e-adbe-0fe7a0ce9c14",   // ShrinkWrapKing
  pixel:     "77c04790-c7fe-483f-b8e5-5bdec66a7b33",   // PixelPulls
  nightshade:"b63faca4-0cce-42f1-86b0-40fcceb0ec6c",  // SlabGod
};

const now = Date.now();
const m = (mins: number) => new Date(now - mins * 60000).toISOString();

// Wave 2 — recent activity, picks up from last session + new threads
const MESSAGES: { user_id: string; content: string; created_at: string }[] = [

  // ── ~55 min ago — new set hype kicks off ──────────────────────────────────
  { user_id: U.karen,     content: "has anyone seen the Journey Together spoilers?? the new Pikachu alt art is actually insane", created_at: m(57) },
  { user_id: U.pixel,     content: "WAIT which one send me the pic rn", created_at: m(55) },
  { user_id: U.nightshade,content: "yeah already saw it, that thing is going to be stupid expensive at launch", created_at: m(53) },
  { user_id: U.jordan,    content: "every new set the alts look better lol my wallet is suffering", created_at: m(51) },
  { user_id: U.sealed,    content: "already preordered 3 cases. not even gonna lie", created_at: m(49) },
  { user_id: U.karen,     content: "lmaooo ShrinkWrapKing living up to the name", created_at: m(47) },
  { user_id: U.sealed,    content: "i have a problem and i've accepted it", created_at: m(46) },
  { user_id: U.pixel,     content: "ok i found it holy moly. that illustration goes SO hard", created_at: m(44) },
  { user_id: U.nightshade,content: "low pop alt art Pikachu PSA 10 is going to print money. calling it now", created_at: m(42) },
  { user_id: U.jordan,    content: "Pikachu cards always hold. doesn't matter what set, they hold.", created_at: m(40) },

  // ── ~38 min ago — grail cards thread ─────────────────────────────────────
  { user_id: U.pixel,     content: "random q but what's everyone's grail card they still don't have", created_at: m(38) },
  { user_id: U.jordan,    content: "1st Ed Shadowless Charizard PSA 10. will probably never happen at current prices but a man can dream", created_at: m(36) },
  { user_id: U.nightshade,content: "CGC Pristine 10 Illustrator. yes i know. yes i'm delusional", created_at: m(34) },
  { user_id: U.karen,     content: "mine is the Gold Star Rayquaza in PSA 10. seen maybe 3 ever and they never come up for sale", created_at: m(32) },
  { user_id: U.sealed,    content: "1st Ed Base Set booster box sealed. peak sealed collector grail imo", created_at: m(31) },
  { user_id: U.pixel,     content: "mine is embarrassing compared to you guys lol. just a NM 1st Ed Pikachu yellow cheeks", created_at: m(29) },
  { user_id: U.jordan,    content: "that's not embarrassing at all, yellow cheeks in high grade is legitimately hard to find", created_at: m(27) },
  { user_id: U.nightshade,content: "yellow cheeks NM without the print lines is rarer than most people realize. solid grail", created_at: m(25) },
  { user_id: U.pixel,     content: "wait actually?? i always thought it was kind of common", created_at: m(24) },
  { user_id: U.karen,     content: "the centering on those cards is brutal, most come off-center. finding a 10 candidate is tough", created_at: m(22) },

  // ── ~20 min ago — someone drops a find ───────────────────────────────────
  { user_id: U.jordan,    content: "just listed a NM 1st Ed Jungle Electrode btw, if anyone's building out Jungle. priced fair", created_at: m(20) },
  { user_id: U.nightshade,content: "solid add. Jungle Electrode in high grade is slept on", created_at: m(18) },
  { user_id: U.karen,     content: "checking it out now. does it have any edge wear?", created_at: m(17) },
  { user_id: U.jordan,    content: "minimal — a couple tiny whitening spots on back corners. all in the photos", created_at: m(16) },
  { user_id: U.karen,     content: "fair enough, DMing you", created_at: m(15) },

  // ── ~13 min ago — shipping talk ───────────────────────────────────────────
  { user_id: U.pixel,     content: "can i ask what everyone uses for shipping? i've been just doing bubble mailers and i'm paranoid", created_at: m(13) },
  { user_id: U.sealed,    content: "for anything over like $20 i do box + bubble wrap + top loader in a team bag. overkill maybe but never had a damage claim", created_at: m(12) },
  { user_id: U.nightshade,content: "slabs go in a gem case inside a small box, always. never mailers for graded cards ever", created_at: m(11) },
  { user_id: U.jordan,    content: "raw singles: top loader + team bag + cardboard stiffener in a bubble mailer. works for 95% of trades", created_at: m(10) },
  { user_id: U.karen,     content: "^ this. and always put 'do not bend' on the outside even though we all know it doesn't do anything lol", created_at: m(9) },
  { user_id: U.pixel,     content: "what's a team bag? i just tape the top loader closed", created_at: m(8) },
  { user_id: U.sealed,    content: "resealable plastic bag that fits a top loader. keeps moisture out. like $5 for 100 on amazon", created_at: m(7) },
  { user_id: U.pixel,     content: "oh easy, ordering those today. thanks for the tip", created_at: m(6) },
  { user_id: U.nightshade,content: "also always use semi-rigid holders for anything valuable, not just top loaders. way more crush resistant", created_at: m(5) },

  // ── ~3 min ago — hot takes / banter ─────────────────────────────────────
  { user_id: U.jordan,    content: "unpopular opinion: the original Base Set art style is still better than anything they've made since", created_at: m(4) },
  { user_id: U.karen,     content: "HARD disagree, the modern alt arts blow vintage art out of the water", created_at: m(3) },
  { user_id: U.sealed,    content: "nostalgia goggles are strong with VintageVault_", created_at: m(2) },
  { user_id: U.jordan,    content: "Ken Sugimori's work hits different. i will die on this hill", created_at: m(2) },
  { user_id: U.nightshade,content: "both can be good, but for PSA 10 value the modern alts are winning on investment. base set wins on legacy", created_at: m(1) },
  { user_id: U.pixel,     content: "i like both 😭 can't we just all get along and collect everything", created_at: m(1) },
];

async function main() {
  console.log(`Inserting ${MESSAGES.length} new chat messages…`);
  let ok = 0, fail = 0;
  for (const msg of MESSAGES) {
    const { error } = await sb.from("global_chat_messages").insert({
      user_id:    msg.user_id,
      content:    msg.content,
      created_at: msg.created_at,
    });
    if (error) { console.error("✗", msg.content.slice(0, 40), error.message); fail++; }
    else ok++;
  }
  console.log(`Done. ${ok} inserted, ${fail} failed.`);
}

main();
