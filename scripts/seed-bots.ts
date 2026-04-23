import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AVATAR_STYLES = [
  "adventurer","avataaars","bottts","fun-emoji","identicon",
  "lorelei","pixel-art","shapes","thumbs","big-smile",
];

const PERSONALITIES = ["casual","hype","vintage","competitive","sealed","grader","investor"] as const;

const POKEMON = [
  "Charizard","Pikachu","Mewtwo","Gengar","Dragonite","Eevee","Snorlax","Alakazam",
  "Machamp","Raichu","Blastoise","Venusaur","Articuno","Zapdos","Moltres","Lapras",
  "Vaporeon","Jolteon","Flareon","Espeon","Umbreon","Leafeon","Glaceon","Sylveon",
  "Lugia","HoOh","Celebi","Rayquaza","Groudon","Kyogre","Deoxys","Garchomp",
  "Lucario","Togekiss","Gardevoir","Gallade","Magnezone","Infernape","Empoleon",
  "Typhlosion","Feraligatr","Meganium","Ampharos","Scizor","Heracross","Gyarados",
  "Aerodactyl","Electabuzz","Magmar","Jynx","Pinsir","Tauros","Porygon","Ditto",
  "Slowbro","Slowking","Nidoking","Nidoqueen","Clefable","Wigglytuff","Arcanine",
  "Rapidash","Haunter","Golem","Onix","Steelix","Breloom","Slaking","Hariyama",
  "Ninjask","Shedinja","Exploud","Manectric","Camerupt","Altaria","Claydol",
  "Milotic","Tropius","Absol","Glalie","Salamence","Metagross","Registeel",
  "Regirock","Regice","Latios","Latias","Jirachi","Manaphy","Darkrai","Shaymin",
  "Arceus","Victini","Zoroark","Volcarona","Terrakion","Virizion","Cobalion",
  "Reshiram","Zekrom","Kyurem","Keldeo","Greninja","Sylveon","Goodra","Noivern",
  "Aegislash","Talonflame","Hawlucha","Aurorus","Tyrantrum","Diancie","Hoopa",
  "Incineroar","Decidueye","Primarina","Lycanroc","Mimikyu","Tapu Koko","Solgaleo",
  "Lunala","Necrozma","Magearna","Marshadow","Zeraora","Corviknight","Dragapult",
];

const SUFFIXES = [
  "TCG","Cards","Pulls","Collector","Grader","Trader","Hunter","Vault","Zone",
  "PNW","NYC","LA","TX","ATX","UK","AU","CA","EU","JP",
  "99","88","77","420","007","X","Pro","Official","Real","Irl",
  "King","God","Lord","Legend","Ace","OG","Elite","Prime","Ultra","Max",
  "_v2","_irl","_tcg","_fx","_ex","_gx","_vmax","_vstar",
];

const PREFIXES = [
  "dark","shadow","shiny","golden","rare","holo","secret","alt","full","rainbow",
  "psa","cgc","bgs","sgc","nm","lp","mp","raw","sealed","mint",
  "the","og","real","irl","idk","tbh","ngl","lol","imo","smh",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeUsername(i: number): string {
  const base = rand(POKEMON).toLowerCase().replace(/[^a-z0-9]/g, "");
  const style = i % 4;
  if (style === 0) return `${base}${rand(SUFFIXES).toLowerCase()}`.slice(0, 28);
  if (style === 1) return `${rand(PREFIXES)}${base}`.slice(0, 28);
  if (style === 2) return `${base}_${String(Math.floor(Math.random() * 9000) + 1000)}`;
  return `${base}${String(Math.floor(Math.random() * 99) + 1)}`;
}

function makeDisplayName(username: string, personality: string): string {
  const templates: Record<string, string[]> = {
    casual:      ["$u", "$u 🃏", "$u ✨", "$u lol", "$u :)"],
    hype:        ["$u 🔥", "$u ⚡", "$u 🚀", "$u 💥", "hype $u"],
    vintage:     ["$u 📼", "$u OG", "$u 1999", "vin/$u", "$u retro"],
    competitive: ["$u meta", "$u 🏆", "$u grind", "$u plays", "$u comp"],
    sealed:      ["$u 📦", "$u sealed", "$u box", "$u shrink", "vault/$u"],
    grader:      ["$u PSA", "$u slabs", "$u 🔍", "$u grade", "$u 10"],
    investor:    ["$u 📈", "$u bag", "$u gains", "$u 💰", "$u holds"],
  };
  const template = rand(templates[personality] || templates.casual);
  return template.replace("$u", username).slice(0, 30);
}

const BIOS: Record<string, string[]> = {
  casual: [
    "just here to collect cards i like, no pressure",
    "grew up with pokemon, never stopped lol",
    "casual collector. mostly buy, sometimes trade",
    "not an investor just a guy who likes cards",
    "buying cards my parents wouldn't let me have as a kid",
  ],
  hype: [
    "EVERY pack is a hit if you believe 🔥",
    "here for the rips, the reveals, and the hype",
    "if it's not going crazy i don't want it",
    "alt art or bust. no exceptions.",
    "chasing the dopamine from every pack opening",
  ],
  vintage: [
    "base set through neo only. modern doesn't exist to me",
    "1st edition or nothing. that's the whole thesis",
    "hoarding shadowless cards like it's my full time job",
    "if it's not from 1999-2003 i'm not interested",
    "the jungle set is criminally underrated, fight me",
  ],
  competitive: [
    "3x regionals top 8. still grinding",
    "if it's not playable i don't need 4 copies",
    "tournament prep mode 24/7",
    "meta staples only. ask me about current tier 1",
    "playing since XY. here for trades on staples",
  ],
  sealed: [
    "if it's sealed it stays sealed. period.",
    "etbs, booster boxes, cases. all of it. always.",
    "the smell of a freshly opened case is unmatched",
    "preordering every set since 2015, no regrets",
    "sealed is the only investment that sparks joy",
  ],
  grader: [
    "PSA 10 or the card doesn't exist",
    "pop report checking is my morning routine",
    "every raw card i own is a future submission",
    "11 month turnaround was worth it. i'd do it again",
    "CGC for speed, PSA for value. both have a place",
  ],
  investor: [
    "cards go up. always have. just hold.",
    "watching the market so you don't have to",
    "low pop + high demand = buy everything",
    "bought charizard in 2019. you know the rest.",
    "not financial advice. but also definitely buy",
  ],
};

function makeBio(personality: string): string {
  return rand(BIOS[personality] || BIOS.casual);
}

function makeAvatar(id: number): { style: string; seed: string } {
  return {
    style: AVATAR_STYLES[id % AVATAR_STYLES.length],
    seed:  `bot-seed-${id}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

async function main() {
  console.log("Generating 1000 bots…");

  // Check if already seeded
  const { count } = await sb.from("bots").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= 1000) {
    console.log(`Already have ${count} bots. Skipping.`);
    return;
  }

  const usedUsernames = new Set<string>();
  const bots: {
    username: string; display_name: string; avatar_seed: string;
    avatar_style: string; bio: string; personality: string;
    chat_enabled: boolean; posting_enabled: boolean;
  }[] = [];

  for (let i = 0; i < 1000; i++) {
    let username = makeUsername(i);
    let attempts = 0;
    while (usedUsernames.has(username) && attempts < 10) {
      username = makeUsername(i + attempts * 1000);
      attempts++;
    }
    if (usedUsernames.has(username)) username = `bot_${i}_${Math.random().toString(36).slice(2, 6)}`;
    usedUsernames.add(username);

    const personality = PERSONALITIES[i % PERSONALITIES.length];
    const avatar = makeAvatar(i);
    // Mix of enabled/disabled at start — 70% chat on, 60% posting on
    const chatEnabled    = Math.random() < 0.7;
    const postingEnabled = Math.random() < 0.6;

    bots.push({
      username,
      display_name:    makeDisplayName(username, personality),
      avatar_seed:     avatar.seed,
      avatar_style:    avatar.style,
      bio:             makeBio(personality),
      personality,
      chat_enabled:    chatEnabled,
      posting_enabled: postingEnabled,
    });
  }

  // Batch insert in chunks of 100
  let inserted = 0;
  for (let i = 0; i < bots.length; i += 100) {
    const chunk = bots.slice(i, i + 100);
    const { error } = await sb.from("bots").insert(chunk);
    if (error) console.error(`Chunk ${i}-${i + 100} failed:`, error.message);
    else { inserted += chunk.length; process.stdout.write(`\r${inserted}/1000`); }
  }
  console.log(`\nDone — ${inserted} bots created.`);
}

main();
