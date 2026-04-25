import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SEALED_PRODUCT_TYPES = new Set([
  "booster_pack", "booster_box", "etb", "tin", "collection_box",
  "theme_deck", "starter_deck", "bundle", "promo_pack", "master_set", "other_sealed",
]);

const RAW_CONDITIONS = ["NM", "NM", "NM", "LP", "LP", "MP"] as const;
const GRADING_COMPANIES = ["PSA", "PSA", "CGC", "BGS"] as const;
const SEALED_CONDITIONS = ["factory_sealed", "factory_sealed", "sealed_no_outer_wrap"] as const;
const GRADES = [7, 7.5, 8, 8.5, 9, 9, 9.5, 10] as const;

const CHAT_MESSAGES: Record<string, string[]> = {
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

const BOARD_POSTS: Record<string, Array<{ content: string; post_type: string }>> = {
  casual: [
    { content: "anyone have spare pikachu cards? not picky about set or condition, just love collecting them", post_type: "looking_for" },
    { content: "selling off some duplicates from my binder, mostly commons and uncommons from modern sets", post_type: "selling" },
    { content: "happy to trade modern doubles for anything i'm missing, not fussy about value matching exactly", post_type: "trading" },
    { content: "looking for affordable base set cards to frame on my wall. condition doesn't need to be perfect", post_type: "looking_for" },
    { content: "does anyone buy bulk commons? have a huge pile taking up space and want to give them a good home", post_type: "selling" },
    { content: "looking for any eeveelution cards, they're my favourite and i want every version ever printed", post_type: "looking_for" },
    { content: "selling a small collection, mostly 2020-2023 stuff. priced cheap just to move them along", post_type: "selling" },
    { content: "does condition matter that much for display cards? asking for my binder builds", post_type: "general" },
    { content: "would anyone trade a charizard card (any edition) for a bunch of stuff from my collection?", post_type: "trading" },
    { content: "first time buying singles here, what should i know before i start messaging people?", post_type: "general" },
  ],
  hype: [
    { content: "WHO HAS EXTRA ALT ARTS from the latest set. need them. name your price and i'll make it work", post_type: "buying" },
    { content: "bulk buying anything chase from the current set. serious buyer, fast payment", post_type: "buying" },
    { content: "selling a gold card, this thing is absolutely gorgeous in hand. serious offers only please", post_type: "selling" },
    { content: "NEED Charizard ex special art ASAP before the price spikes further. who has one", post_type: "buying" },
    { content: "anyone preordering the new set? thinking about going in on a case split to reduce per-box cost", post_type: "general" },
    { content: "selling my duplicate secret rares from the last 3 sets. DM for a full list with prices", post_type: "selling" },
    { content: "buying every Umbreon alt art variant I can find. if you have one, talk to me", post_type: "buying" },
    { content: "who wants to do a box split on the new set? going halves on a booster box", post_type: "general" },
    { content: "selling these to fund my next box purchase. priced to go fast", post_type: "selling" },
    { content: "is anyone else addicted to opening packs on live? send help and also ETBs", post_type: "general" },
  ],
  vintage: [
    { content: "WTB: 1st edition base set cards in any condition. especially looking for Charizard, Blastoise, Venusaur", post_type: "buying" },
    { content: "selling shadowless holos from base set, all NM condition, serious buyers only please", post_type: "selling" },
    { content: "anyone have WOTC era collections to move? looking to buy whole collections from the right seller", post_type: "buying" },
    { content: "trading modern staples for vintage singles. prefer WOTC era. fair trade values, no low offers", post_type: "trading" },
    { content: "LF: Neo Genesis Lugia in NM or better. willing to pay a proper price for the right copy", post_type: "looking_for" },
    { content: "selling Team Rocket 1st edition holos, documented and graded, serious collectors only", post_type: "selling" },
    { content: "looking to buy Gym Heroes and Gym Challenge holos, any condition considered for the right price", post_type: "buying" },
    { content: "does anyone have Fossil set cards they'd sell as a lot? trying to complete the set", post_type: "buying" },
    { content: "trading my modern pulls for vintage anything. i just want old cards. DM me what you have", post_type: "trading" },
    { content: "selling some jungle holos that came back from PSA. fair comp-based pricing", post_type: "selling" },
  ],
  competitive: [
    { content: "LF: 4x Iono. offering cash or will trade current meta staples. urgent before my next locals", post_type: "looking_for" },
    { content: "selling spare competitive staples rotating out of format next quarter. priced to move", post_type: "selling" },
    { content: "WTB Pidgeot ex playset, need before regionals this weekend. paying market for quick deal", post_type: "buying" },
    { content: "trading out of rotation cards for current meta picks. have a decent pile to work with", post_type: "trading" },
    { content: "need 2 more Gardevoir ex to complete my playset. who has them at a reasonable price", post_type: "looking_for" },
    { content: "selling my spare Chien-Pao build pieces, replacing the whole deck. prices are fair", post_type: "selling" },
    { content: "anyone doing a prerelease for the new set this weekend? want to trade after the event", post_type: "general" },
    { content: "buying bulk tournament staples, especially supporters. need Iono, Boss, Arven", post_type: "buying" },
    { content: "trading my spare regionals promo for something i actually need in my current list", post_type: "trading" },
    { content: "who's going to regionals next month? maybe we can arrange some trades there in person", post_type: "general" },
  ],
  sealed: [
    { content: "selling 3 sealed ETBs from the last set, stored in cool dry conditions since day one", post_type: "selling" },
    { content: "LF sealed booster boxes from 2020-2022, paying market price for well-stored boxes", post_type: "looking_for" },
    { content: "have sealed product to trade but sealed only, not interested in trading for raw singles", post_type: "trading" },
    { content: "buying sealed vintage packs if anyone is willing to part with them. real money available", post_type: "buying" },
    { content: "selling some duplicate sealed ETBs from sets I overcommitted on. will deal on multiples", post_type: "selling" },
    { content: "anyone have sealed SV era booster boxes? looking to add 2-3 more to my sealed vault", post_type: "buying" },
    { content: "selling a sealed booster box I've had since release. storage has been perfect", post_type: "selling" },
    { content: "looking to trade sealed for sealed only. have modern SV era boxes to swap", post_type: "trading" },
    { content: "what's the best way to store sealed product long term? humidity control vs just dark and cool?", post_type: "general" },
    { content: "LF factory sealed ETBs from Evolving Skies era. willing to pay premium for right condition", post_type: "looking_for" },
  ],
  grader: [
    { content: "selling PSA 10s from my recent submission batch, got back more tens than expected. DM for list", post_type: "selling" },
    { content: "WTB NM raw copies of vintage holos for grading. paying slightly under market to account for grading cost", post_type: "buying" },
    { content: "trading graded cards for other graded only. looking to upgrade some of my lower slabs", post_type: "trading" },
    { content: "LF: NM copies of neo genesis starters for a PSA batch submission. timing sensitive", post_type: "looking_for" },
    { content: "selling a BGS 9.5 from my collection, priced fairly based on recent comparable sales", post_type: "selling" },
    { content: "buying raw NM moderns with low PSA 10 pop potential. happy to discuss specifics", post_type: "buying" },
    { content: "got back a PSA 10 on a card I bought raw for $8. that's why you grade everything decent", post_type: "general" },
    { content: "selling my CGC graded lot, moving fully to PSA. all cards come with comp data", post_type: "selling" },
    { content: "looking for any 1st ed WOTC cards in NM for a large grading submission. buying in bulk", post_type: "buying" },
    { content: "trading my lower grade slabs (7s and 8s) for anything in a 9 or better slab", post_type: "trading" },
  ],
  investor: [
    { content: "trimming some positions, selling select vintage pieces. not distressed, just rebalancing the portfolio", post_type: "selling" },
    { content: "WTB vintage holos in quantity. if you have a collection to liquidate let's have a real conversation", post_type: "buying" },
    { content: "LF: undervalued sealed product from 2017-2020. paying fair prices for the right inventory", post_type: "looking_for" },
    { content: "trading modern chase for vintage. any era considered. prefer WOTC but will evaluate everything", post_type: "trading" },
    { content: "selling a position I've held since 2019, returns have been excellent. someone else's turn to hold", post_type: "selling" },
    { content: "buying sealed product systematically. if you have cases to move, DM with photos and asking price", post_type: "buying" },
    { content: "looking for grail vintage cards from serious collectors who need liquidity. discreet, fair offers", post_type: "buying" },
    { content: "selling off some of my modern speculation positions. market timing looks right to rotate to vintage", post_type: "selling" },
    { content: "anyone tracking the Japanese exclusive market? seeing some interesting price divergence vs US", post_type: "general" },
    { content: "trading modern sealed for raw vintage. looking for WOTC era specifically", post_type: "trading" },
  ],
};

type BotRow = { id: string; personality: string };
type CardRow = { id: string; product_type: string };

function buildListing(personality: string, card: CardRow) {
  const isSealed = SEALED_PRODUCT_TYPES.has(card.product_type);

  const sealedBase: Record<string, number> = { casual: 12, hype: 50, vintage: 90, competitive: 35, sealed: 65, grader: 45, investor: 110 };
  const singleBase: Record<string, number> = { casual: 2, hype: 25, vintage: 60, competitive: 18, sealed: 8, grader: 30, investor: 50 };
  const base = isSealed ? (sealedBase[personality] ?? 25) : (singleBase[personality] ?? 8);
  const price = parseFloat((base * (0.55 + Math.random() * 0.9)).toFixed(2));

  const listingType = Math.random() < 0.72 ? "for_sale" : "wanted";

  let condition_type: string;
  let raw_condition: string | null = null;
  let grading_company: string | null = null;
  let grade: number | null = null;
  let sealed_condition: string | null = null;

  if (isSealed) {
    condition_type = "sealed";
    sealed_condition = rand(SEALED_CONDITIONS);
  } else if (
    (personality === "grader" && Math.random() < 0.6) ||
    (personality === "vintage" && Math.random() < 0.3) ||
    (personality === "investor" && Math.random() < 0.2)
  ) {
    condition_type = "graded";
    grading_company = rand(GRADING_COMPANIES);
    grade = rand(GRADES);
  } else {
    condition_type = "raw";
    raw_condition = rand(RAW_CONDITIONS);
  }

  return { listing_type: listingType, condition_type, raw_condition, grading_company, grade, sealed_condition, price, status: "active", is_featured: false };
}

export async function runBotTick(count: number): Promise<{ ok: boolean; sent: number; chat: number; board: number; listings: number }> {
  const sb = getClient();
  const safeCount = Math.min(count, 50);

  const { data: activeBots } = await sb
    .from("bots")
    .select("id, personality")
    .eq("chat_enabled", true)
    .order("last_active_at", { ascending: true, nullsFirst: true })
    .limit(safeCount * 3);

  if (!activeBots || activeBots.length === 0) return { ok: true, sent: 0, chat: 0, board: 0, listings: 0 };

  const bots = (activeBots as BotRow[]).sort(() => Math.random() - 0.5).slice(0, safeCount);
  const now = Date.now();
  let chat = 0, board = 0, listings = 0;

  // Fetch a card pool once for listing creation
  const { data: cards } = await sb
    .from("cards")
    .select("id, product_type")
    .eq("language", "en")
    .neq("product_type", "other")
    .limit(500);
  const cardPool = (cards ?? []) as CardRow[];

  for (const bot of bots) {
    const roll = Math.random();
    const offsetMs = Math.floor(Math.random() * 3 * 60 * 1000);
    const created_at = new Date(now - offsetMs).toISOString();

    if (roll < 0.55) {
      // Chat message
      const pool = CHAT_MESSAGES[bot.personality] ?? CHAT_MESSAGES.casual;
      const { error } = await sb.from("global_chat_messages").insert({
        user_id: bot.id, bot_id: bot.id, content: rand(pool), created_at,
      });
      if (!error) chat++;
    } else if (roll < 0.80) {
      // Board post
      const pool = BOARD_POSTS[bot.personality] ?? BOARD_POSTS.casual;
      const { content, post_type } = rand(pool);
      const { error } = await sb.from("board_posts").insert({
        user_id: bot.id, content, post_type,
      });
      if (!error) board++;
    } else if (cardPool.length > 0) {
      // Listing — only if bot has fewer than 5 active listings
      const { count: existingCount } = await sb
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", bot.id)
        .eq("status", "active");
      if ((existingCount ?? 0) < 5) {
        const card = rand(cardPool);
        const listing = buildListing(bot.personality, card);
        const { error } = await sb.from("listings").insert({ user_id: bot.id, card_id: card.id, price_type: "firm", ...listing });
        if (!error) listings++;
      }
    }

    await sb.from("bots").update({ last_active_at: new Date().toISOString() }).eq("id", bot.id);
  }

  const sent = chat + board + listings;
  return { ok: true, sent, chat, board, listings };
}

export async function runSingleBotTick(botId: string): Promise<string> {
  const sb = getClient();
  const { data: bot } = await sb
    .from("bots")
    .select("id, personality")
    .eq("id", botId)
    .single();
  if (!bot) return "";

  const pool = CHAT_MESSAGES[(bot as BotRow).personality] ?? CHAT_MESSAGES.casual;
  const content = rand(pool);
  await sb.from("global_chat_messages").insert({
    user_id: bot.id, bot_id: bot.id, content,
  });
  await sb.from("bots").update({ last_active_at: new Date().toISOString() }).eq("id", botId);
  return content;
}
