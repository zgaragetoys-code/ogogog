import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BOT_SECRET = process.env.BOT_TICK_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isAuthorized(req: Request): boolean {
  // Accept x-bot-secret header (manual admin trigger)
  const botSecret = req.headers.get("x-bot-secret");
  if (BOT_SECRET && botSecret === BOT_SECRET) return true;

  // Accept Vercel cron Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;

  return false;
}

// ── Message bank keyed by personality ────────────────────────────────────────

const MESSAGES: Record<string, string[]> = {
  casual: [
    "anyone else just buying cards they like and ignoring the market lol",
    "found a holo in a random binder at a garage sale today. still buzzing",
    "do you guys sleeve immediately or wait until you have a full set?",
    "bought a pack just for fun. got a basic energy. peak pokemon experience",
    "honestly just happy to be here collecting stuff I love",
    "my storage system is a shoebox and I'm at peace with that",
    "opened a pack with my kid today, she pulled a shiny. she's hooked now lol",
    "this hobby is so much better when you stop caring about prices",
    "throwback to when you could actually find packs at target",
    "anyone have good recommendations for beginner sets to start with?",
    "just organized my whole binder by type. took 4 hours. worth it.",
    "pulled a rare today at my local game store, made my week tbh",
    "can't believe i have 3 copies of the same common. classic",
    "trading doubles for anything i don't have, hmu",
    "just picked up a card I've wanted since I was a kid. surreal feeling",
  ],
  hype: [
    "BRO THE NEW ALT ART IS INSANE. who else is going all in",
    "just ripped an ETB on stream. we hit",
    "preorders open RIGHT NOW for the new set. don't sleep",
    "this pull made my entire month i'm not joking",
    "new set drops friday who's doing midnight openings",
    "ok the secret rares in this set are DIFFERENT. artwork is insane",
    "bro imagine being the person who pulls the illustrator. life changing",
    "my heart rate every time i see a golden pack",
    "just saw someone pull back to back gold cards on live. unreal",
    "hype is real for Journey Together. can't wait",
    "the reveal today broke my brain. that art is CLEAN",
    "every set i say i won't buy a case. every set i buy a case",
    "pulled something crazy. going to PSA. manifesting a 10",
    "if you're not excited about this set you're not paying attention",
    "case opening tonight. expecting nothing. hoping for everything.",
  ],
  vintage: [
    "reminder that 1st ed Base Set Charizard hit $400k at auction last year",
    "the shadowless print run is genuinely rare and people still don't get it",
    "Jungle and Fossil holos are so undervalued compared to Base Set rn",
    "my 1st ed Venusaur is not for sale. it will never be for sale. stop asking",
    "neo genesis Lugia in PSA 10 is one of the best investments in the hobby imo",
    "the art style from Sugimori's era will never be replicated. fact.",
    "anyone else feel like Team Rocket set is completely slept on?",
    "gym leaders set is criminally underrated. Misty's Tentacruel in 10 is gorgeous",
    "base set unlimited is still beautiful and way more affordable. good entry point",
    "spent 6 months finding a NM 1st ed Mewtwo. was worth every second",
    "vintage collectors know: condition is everything. even slight whitening hurts",
    "1999-2003 era is the golden age. everything after is modern to me",
    "if you haven't held a 1st edition card you don't understand the feel difference",
    "back when cards were printed on actual quality cardstock. different era.",
    "Neo Revelation Ampharos Holo is criminally underrated. just saying.",
  ],
  competitive: [
    "anyone testing the new Gardevoir build? the consistency is insane",
    "Chien-Pao is still tier 1 and people are sleeping on it",
    "3-1'd my local last night, feeling good about regionals",
    "the new supporter lineup is going to shake up the meta hard",
    "arceus build is still slept on for the attack pressure it provides",
    "looking for 2 Pidgeot ex to finish my list. anyone?",
    "prize trade math is underrated skill. so many games decided there",
    "anyone playing Sableye in the current format? curious about consistency",
    "tested 40 games with the new list. feels right. going to regionals confident",
    "thinning the deck fast is still the correct strategy. nothing's changed",
    "the energy acceleration in this format is genuinely broken in a fun way",
    "need 3 Iono for my competitive build. offering fair trade value",
    "local league tonight if you're in the area. come test!",
    "just got back from locals. went 4-1. build feels tight.",
    "anyone running counter energy in the current format? curious what for",
  ],
  sealed: [
    "just added another ETB to the vault. we don't crack here",
    "booster box prices are wild but i'm not selling. ever.",
    "sealed vintage is the safest long term hold in the hobby, full stop",
    "my storage room is temperature controlled. yes i'm serious. no regrets.",
    "anyone else refuse to open sealed vintage even when prices dip?",
    "preordering 2 cases of every set. it's not a problem it's an investment",
    "WOTC era sealed is becoming genuinely impossible to find in good condition",
    "a PSA sealed grade on a vintage pack changes the whole value proposition",
    "sold a case from 2017 for 4x what i paid. still holding the rest.",
    "sealed is peaceful. no grading anxiety. no condition debates. just sealed.",
    "just got a shrink intact base set booster pack authenticated. going to PSA",
    "my rule: never crack anything over $100 retail. the box is the card.",
    "reminder that supply is always decreasing. sealed only goes one direction.",
    "ETB arts have gotten so good. some of these are display pieces on their own.",
    "picked up 3 cases of the new set. sealed and stored. see you in 5 years.",
  ],
  grader: [
    "just got 15 cards back from PSA. 3 tens. not bad for a $200 batch",
    "CGC has genuinely improved their turnaround. under 60 days now",
    "the pop report on this card is 4 PSA 10s. I'm hunting one",
    "submitted 40 cards last month. waiting is the hardest part of this hobby",
    "BGS subgrades are brutal but they're honest. PSA is more generous",
    "anyone else check their submission status every day like it changes anything",
    "PSA bulk at $18/card is the move for anything you think grades well",
    "got a 9 on something I was sure was a 10. centering issue on the back. hurts",
    "low pop 10 just sold for crazy money. wish I had submitted earlier",
    "the difference between a PSA 8 and 9 in value is insane on vintage",
    "pro tip: use perfect fit sleeves + card savers for submissions, never top loaders",
    "just got back a CGC Pristine. only the 3rd one for this card ever.",
    "grading is slow but when that 10 comes back it's all worth it",
    "people don't grade commons but a NM 1st ed common PSA 10 is RARE",
    "checking the pop report before every purchase now. changed how I buy.",
  ],
  investor: [
    "vintage cards outperformed the S&P for the 5th year running. just saying",
    "low pop counts are moving FAST. get in before the reports update",
    "charizard 1st ed held value through every dip. it always does.",
    "sealed vintage is appreciating faster than raw right now. data supports it",
    "the market cooled in 2022. anyone who sold then made a mistake. look at it now",
    "trophy cards are the only true scarcity play left in this hobby",
    "set completion demand is driving NM singles up quietly. watch the trackers",
    "PSA 10 pop under 50 on any vintage holo is a buy at almost any price",
    "the Japan market is pricing things higher than US right now. arbitrage window",
    "bought heavy in 2020. sold some in 2021. holding the rest. still up big.",
    "if you're buying for fun that's great. if you're buying as an asset, go vintage.",
    "modern alt arts will hold differently than vintage. different buyer pool.",
    "the grail cards never really correct. they dip then recover and go higher",
    "patience is the whole strategy. buy quality, hold, ignore the noise.",
    "anyone watching the Illustrator market? something is moving on the buy side",
  ],
};

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const count: number = Math.min(Number(body.count) || 8, 30);

  const { data: chatBots } = await sb
    .from("bots")
    .select("id, username, display_name, avatar_seed, avatar_style, personality")
    .eq("chat_enabled", true)
    .order("last_active_at", { ascending: true, nullsFirst: true })
    .limit(count * 3);

  if (!chatBots || chatBots.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const shuffled = chatBots.sort(() => Math.random() - 0.5).slice(0, count);
  const now = Date.now();
  let sent = 0;

  for (let i = 0; i < shuffled.length; i++) {
    const bot = shuffled[i];
    const pool = MESSAGES[bot.personality] ?? MESSAGES.casual;
    const content = rand(pool);

    // Stagger messages within the past 4 minutes for natural look
    const offsetMs = Math.floor(Math.random() * 4 * 60 * 1000);
    const created_at = new Date(now - offsetMs).toISOString();

    const { error } = await sb.from("global_chat_messages").insert({
      user_id: bot.id,
      bot_id: bot.id,
      content,
      created_at,
    });

    if (!error) {
      await sb.from("bots").update({ last_active_at: new Date().toISOString() }).eq("id", bot.id);
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}

// Vercel cron jobs send GET. Only CRON_SECRET in Authorization header is accepted here.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST(req);
}
