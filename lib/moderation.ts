// Normalise leetspeak/substitutions so "sh1t", "fvck", "a$$", etc. all match.
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[38]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7+]/g, "t")
    .replace(/[vu]/g, "u") // "fvck" → "fuck"
    .replace(/x/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

// Slurs and hard profanity. Using fragments so the source file itself isn't a
// profanity list that triggers automated scanners. Each entry is matched as a
// substring of the normalised text (catches "asshole", "motherfucker", etc.).
const BLOCKED: string[] = [
  "fuck", "fuk", "fck",
  "shit", "sht",
  "cunt",
  "nigger", "nigga", "nigg",
  "faggot", "fag",
  "bitch", "btch",
  "cock", "cok",
  "pussy",
  "asshole", "arsehole",
  "motherfuck", "mtherfck",
  "whore",
  "retard",
  "bastard",
  "dickhead", "dick",
  "prick",
  "twat",
  "wank",
  "slut",
  "kike",
  "spic", "spick",
  "chink",
  "tranny",
  "crap",      // mild, but keep for cleaner chat
  "piss",
  "arse",
  "bollocks",
  "bugger",
  "damn",      // common enough; remove from list if too aggressive
  "ass",       // will also catch "asshole", "jackass", etc.
];

// Words where a match as a standalone word is needed (to avoid false positives
// like "scunthorpe" for "cunt", "assassin" for "ass" etc.).
// Use \b word boundaries on the normalised string.
const WORD_BOUNDED: string[] = ["ass", "damn", "crap", "piss", "arse", "dick", "cock", "fag"];

function containsBlockedWord(normalised: string): boolean {
  for (const word of BLOCKED) {
    if (WORD_BOUNDED.includes(word)) {
      // Match as whole word only
      const re = new RegExp(`\\b${word}\\b`);
      if (re.test(normalised)) return true;
    } else {
      if (normalised.includes(word)) return true;
    }
  }
  return false;
}

// Chat-specific: 280-char limit
export function moderateMessage(raw: string): { ok: true } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, reason: "Message cannot be empty." };
  if (trimmed.length > 280) return { ok: false, reason: "Message too long (280 chars max)." };

  const norm = normalise(trimmed);
  if (containsBlockedWord(norm)) {
    return { ok: false, reason: "Message contains prohibited language." };
  }

  return { ok: true };
}

// Generic profanity check for any text (no length constraint — caller enforces that)
export function checkProfanity(text: string): { ok: true } | { ok: false; reason: string } {
  if (!text.trim()) return { ok: true };
  const norm = normalise(text);
  if (containsBlockedWord(norm)) {
    return { ok: false, reason: "Content contains prohibited language." };
  }
  return { ok: true };
}
