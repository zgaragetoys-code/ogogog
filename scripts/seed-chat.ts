import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USERS = {
  jordan:    "8b5f01d8-a91a-4fc1-a353-7676c0d08201",  // jordancollects
  karen:     "649efeeb-ac86-4f63-8184-cbcdbc370349",   // karentradesvtg
  sealed:    "febaf952-2a15-435e-adbe-0fe7a0ce9c14",   // sealedvault
  pixel:     "77c04790-c7fe-483f-b8e5-5bdec66a7b33",   // pixelpokemon88
  nightshade:"b63faca4-0cce-42f1-86b0-40fcceb0ec6c",  // nightshadecards
};

const now = Date.now();
const h = (hours: number, extraMins = 0) =>
  new Date(now - hours * 3600000 - extraMins * 60000).toISOString();

const MESSAGES: { user_id: string; content: string; created_at: string }[] = [
  // ── 18 hours ago — sealed prices kicking off ──────────────────────────────
  { user_id: USERS.sealed,    content: "Anyone else notice sealed prices going up again lately? ETBs are getting wild", created_at: h(18, 12) },
  { user_id: USERS.jordan,    content: "Yeah been saying this for months lol. Base Set stuff too — shadowless holos jumped like 40% since January", created_at: h(18, 8) },
  { user_id: USERS.pixel,     content: "wait really?? I thought prices were supposed to be cooling down", created_at: h(18, 5) },
  { user_id: USERS.karen,     content: "Sealed is definitely up. Singles market has been weirdly mixed though, some stuff dropping at the same time", created_at: h(18, 1) },
  { user_id: USERS.nightshade,content: "PSA 10 pop reports are what really move things. Low pop = huge premium. High pop = floor keeps sliding", created_at: h(17, 52) },
  { user_id: USERS.sealed,    content: "Pop reports are everything now. I check them before buying anything seriously", created_at: h(17, 48) },

  // ── 15 hours ago — grading results ───────────────────────────────────────
  { user_id: USERS.jordan,    content: "Got my Charizard back from PSA yesterday finally. PSA 10 ✅", created_at: h(15, 20) },
  { user_id: USERS.nightshade,content: "Congrats!! Shadowless or 1st Ed?", created_at: h(15, 17) },
  { user_id: USERS.jordan,    content: "1st Ed. Took 11 months but worth every minute of waiting", created_at: h(15, 14) },
  { user_id: USERS.nightshade,content: "11 months lol what service level?", created_at: h(15, 11) },
  { user_id: USERS.jordan,    content: "Standard haha I'm not paying walkthrough rates. Could've bought another raw copy for what that costs", created_at: h(15, 8) },
  { user_id: USERS.karen,     content: "I switched to CGC for most stuff lately, turnaround has been way faster", created_at: h(15, 4) },
  { user_id: USERS.nightshade,content: "CGC is solid but resale value is still noticeably lower than PSA on vintage. For modern it barely matters though", created_at: h(14, 58) },
  { user_id: USERS.pixel,     content: "are CGC grades the same scale as PSA? never actually used them", created_at: h(14, 55) },
  { user_id: USERS.karen,     content: "Basically same scale, both go to 10. CGC has a Pristine 10 that's above a regular 10 though", created_at: h(14, 51) },
  { user_id: USERS.nightshade,content: "Pristine is super rare in practice. Like 1-2% of submissions. It's the holy grail", created_at: h(14, 47) },

  // ── 11 hours ago — box opening ────────────────────────────────────────────
  { user_id: USERS.sealed,    content: "Just finished opening a case of Prismatic Evolutions. Results were... not great lol", created_at: h(11, 30) },
  { user_id: USERS.pixel,     content: "oof how bad are we talking", created_at: h(11, 26) },
  { user_id: USERS.sealed,    content: "1 Umbreon ex in the entire case. One. Should've just bought singles outright", created_at: h(11, 22) },
  { user_id: USERS.karen,     content: "Prismatic feels so EV negative right now. The hit rate doesn't math out vs just buying the cards you want", created_at: h(11, 18) },
  { user_id: USERS.pixel,     content: "I still can't even find one at retail 😭 every store near me has been sold out for weeks", created_at: h(11, 14) },
  { user_id: USERS.sealed,    content: "They've been restocking randomly on weekends at TRU and Target. Worth checking early Saturday morning", created_at: h(11, 10) },
  { user_id: USERS.jordan,    content: "The scalpers have bots watching inventory alerts now, they're there in minutes. It's honestly pointless", created_at: h(11, 6) },
  { user_id: USERS.pixel,     content: "yeah that's what I figured. might just buy singles like everyone's saying", created_at: h(11, 1) },

  // ── 8 hours ago — trading, what they need ────────────────────────────────
  { user_id: USERS.karen,     content: "Anyone have a NM Gardevoir ex SAR they'd part with? Trying to finish my Paldea SAR set", created_at: h(8, 20) },
  { user_id: USERS.nightshade,content: "I have one actually, just listed it here. Check my profile", created_at: h(8, 16) },
  { user_id: USERS.karen,     content: "Oh nice! Sending you a message now", created_at: h(8, 13) },
  { user_id: USERS.jordan,    content: "SAR prices have finally been coming down a bit. Good window to buy if you've been waiting", created_at: h(8, 9) },
  { user_id: USERS.pixel,     content: "dumb question but what does SAR stand for? I keep seeing it", created_at: h(8, 5) },
  { user_id: USERS.karen,     content: "Special Art Rare — the cards with the big full-bleed illustration that goes edge to edge", created_at: h(8, 2) },
  { user_id: USERS.pixel,     content: "ohhhh the beautiful looking ones. I love those cards. Makes way more sense now", created_at: h(7, 58) },
  { user_id: USERS.nightshade,content: "If you're on a budget the regular art versions are identical for play and way cheaper. SARs are purely collector pieces", created_at: h(7, 53) },
  { user_id: USERS.pixel,     content: "good to know, I mostly collect for fun not play so the art matters to me", created_at: h(7, 49) },

  // ── 4 hours ago — grading strategy ──────────────────────────────────────
  { user_id: USERS.sealed,    content: "Question for the grading veterans — is it worth grading a card you think is PSA 9 territory or just sell it raw?", created_at: h(4, 25) },
  { user_id: USERS.nightshade,content: "Really depends on the card. For vintage stuff a raw LP can still command decent money. For modern, only grade if you're confident it's a 10 candidate", created_at: h(4, 20) },
  { user_id: USERS.jordan,    content: "What's the card?", created_at: h(4, 17) },
  { user_id: USERS.sealed,    content: "1st Ed Jungle Scyther holo. Looks LP to me, maybe MP on the back", created_at: h(4, 14) },
  { user_id: USERS.nightshade,content: "LP/MP on 1st Ed Jungle… I'd skip grading unless you're seeing signs of an 8. Grading fees + time will eat most of the premium", created_at: h(4, 10) },
  { user_id: USERS.jordan,    content: "Jungle set is so underrated honestly. Everyone obsesses over Base and forgets how iconic that set was", created_at: h(4, 6) },
  { user_id: USERS.karen,     content: "Facts. Pinsir, Scyther, Snorlax — all underpriced relative to how scarce they actually are", created_at: h(4, 2) },
  { user_id: USERS.nightshade,content: "The real sleeper is 1st Ed Fossil. Nobody talks about it and the holos are genuinely tough to find in high grade", created_at: h(3, 57) },
  { user_id: USERS.jordan,    content: "Gengar and Raichu from Fossil are both criminally undervalued right now imo", created_at: h(3, 52) },

  // ── 1.5 hours ago — garage sale find starts live conversation ────────────
  { user_id: USERS.pixel,     content: "you guys just found a Pikachu promo at a garage sale for literally $2 😂", created_at: h(1, 40) },
  { user_id: USERS.karen,     content: "lol which promo??", created_at: h(1, 37) },
  { user_id: USERS.pixel,     content: "the one with the little pizza slice? I think it's called the topping promo or something", created_at: h(1, 34) },
  { user_id: USERS.jordan,    content: "haha pizza pikachu! That's like $8-12 raw in good condition. Nice little score", created_at: h(1, 30) },
  { user_id: USERS.nightshade,content: "This is why you always check garage sales and thrift stores. Most people have no idea what they're sitting on", created_at: h(1, 26) },
  { user_id: USERS.sealed,    content: "Speaking of — I found a 1st Ed Fossil booster pack at an antique store last year. Sealed. Paid $15 for it", created_at: h(1, 22) },
  { user_id: USERS.pixel,     content: "STOP. No way", created_at: h(1, 19) },
  { user_id: USERS.karen,     content: "I am going to need receipts on this story lol", created_at: h(1, 16) },
  { user_id: USERS.sealed,    content: "Haha I'll dig up the photo. The lady had no idea, thought it was just old junk in a box. Paid $15 for a whole pile of stuff and this was in it", created_at: h(1, 12) },
  { user_id: USERS.jordan,    content: "PSA sealed grades have been going absolutely crazy. What are you doing with it?", created_at: h(1, 8) },
  { user_id: USERS.sealed,    content: "Still holding it. The sealed market keeps going up year over year, feels wrong to move it", created_at: h(1, 4) },
  { user_id: USERS.nightshade,content: "Keep it sealed forever. That's a museum piece at this point. 1st Ed Fossil sealed is rarer than most people realize", created_at: h(0, 59) },
  { user_id: USERS.pixel,     content: "I can't believe stories like this actually happen. I'm going to every garage sale this weekend", created_at: h(0, 54) },
  { user_id: USERS.karen,     content: "The key is looking for stuff from 1999-2003 and knowing what to ask for. Most sellers just want it gone", created_at: h(0, 49) },
  { user_id: USERS.jordan,    content: "Ask if they have any old card collections, board games, or 'kids stuff from the early 2000s'. That usually gets them to the right box", created_at: h(0, 43) },
  { user_id: USERS.pixel,     content: "writing all this down lol. this community is great", created_at: h(0, 38) },
  { user_id: USERS.nightshade,content: "Good luck this weekend. Post here if you find anything, we love a good discovery story", created_at: h(0, 32) },
  { user_id: USERS.sealed,    content: "Welcome to the hobby rabbit hole. There's no coming back 😄", created_at: h(0, 25) },
];

async function main() {
  console.log(`Inserting ${MESSAGES.length} chat messages…`);

  for (const msg of MESSAGES) {
    const { error } = await sb.from("global_chat_messages").insert({
      user_id: msg.user_id,
      content: msg.content,
      created_at: msg.created_at,
    });
    if (error) {
      console.error(`Failed: ${msg.content.slice(0, 40)}…`, error.message);
    }
  }

  console.log("Done.");
}

main();
