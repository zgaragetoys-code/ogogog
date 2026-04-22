# Pokemon TCG Marketplace — Project Context

## What This App Does
A web marketplace for Pokemon TCG collectors to:
- List cards and sealed products **for sale** with a price and condition
- List items they **want to buy**
- Message other users about specific listings (card-scoped threads)
- Browse a public feed of all active listings with filtering

No payment processing on-platform. Users settle deals via PayPal G&S externally.

---

## Tech Stack
- **Frontend:** Next.js 16 (React, App Router) — `/home/sz/ogogog`
- **Styling:** Tailwind CSS v4
- **Backend/DB:** Supabase (Postgres + Auth + Realtime)
- **Hosting:** Vercel
- **DNS/Domain:** Cloudflare
- **Transactional email:** Resend
- **Card data:** TCGdex (tcgdex.dev) — imported once into Supabase, not called at runtime
- **Payments:** None in v1/v2. Stripe only for v3 premium subscriptions.
- **Pricing API:** None, ever. Users set their own prices. No TCGPlayer, PokemonPriceTracker, etc.

---

## Hosting Philosophy
Stay within free tiers. Prefer free-at-small-scale over more scalable but paid.

---

## V1 Feature Scope

### Must include
1. Email/password auth with email confirmation (magic link as secondary/recovery option)
2. Import TCGdex card catalog into Supabase cards table
3. Create listings (for sale or wanted) — full condition/grading/sealed support
4. External photo links on listings (no uploads)
5. Notes field on all listings
6. Public feed of active listings — filter by product_type, condition, set, etc.
7. Listing detail pages
8. User profiles showing their active listings
9. Card-scoped messaging — separate thread per (listing, user pair)
10. Mark listing as sold — thread greys out

### Explicitly out of scope for v1
- Payment processing (users pay each other via PayPal G&S)
- Image uploads (external URLs only)
- Pricing API integration
- Collectr CSV import
- Automated buy/sell matching engine
- Seller/buyer rating system
- Premium subscriptions (Stripe)
- Multi-TCG support
- Mobile native apps
- Deck building tools
- Escrow or card authentication services
- Social logins (Google/GitHub)

---

## Database Schema

### `cards` table (catalog only — populated by import script)
```
id            text PRIMARY KEY          -- TCGdex id e.g. 'swsh1-1'
name          text NOT NULL
set_name      text NOT NULL             -- e.g. 'Sword & Shield'
set_code      text NOT NULL             -- e.g. 'swsh1'
card_number   text NOT NULL             -- localId within set e.g. '001'
rarity        text
image_url     text
release_date  date
language      text DEFAULT 'en'
product_type  product_type_enum NOT NULL
created_at    timestamptz
```

**product_type enum:** `single_card`, `booster_pack`, `booster_box`, `etb`, `tin`,
`collection_box`, `theme_deck`, `starter_deck`, `bundle`, `promo_pack`,
`master_set`, `other_sealed`, `other`

No separate `sets` table. Set info is denormalized onto each card row.

### `profiles` table (auto-created on signup via trigger)
```
id              uuid PK → auth.users
username        text UNIQUE
avatar_url      text
bio             text
seller_rating_total / seller_rating_count  integer (running totals)
buyer_rating_total  / buyer_rating_count   integer (running totals)
created_at, updated_at
```

### `listings` table
```
id                      uuid PK
user_id                 uuid → auth.users
card_id                 text → cards
listing_type            enum: 'for_sale' | 'wanted'
condition_type          enum: 'raw' | 'graded' | 'sealed'
raw_condition           enum: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'       -- if raw
sealed_condition        enum: 'factory_sealed' | 'sealed_no_outer_wrap'
                              | 'opened_contents_sealed' | 'opened_partial'
                              | 'damaged'                               -- if sealed
grading_company         enum: 'PSA' | 'CGC' | 'BGS' | 'SGC'           -- if graded
grade                   numeric(4,1)   -- 1.0–10.0 supports half grades
price                   numeric(10,2)
notes                   text           -- unlimited, included in full-text search
photo_links             text[]         -- external URLs, max ~10
photo_notes             text
master_set_completion   enum: '100_percent' | 'near_complete' | 'partial'
                              -- only when product_type = 'master_set'
master_set_included_cards text         -- user describes what's included
status                  enum: 'active' | 'pending' | 'sold' | 'cancelled'
created_at, updated_at
```

**Constraints:**
- `raw_condition` and `grading_company` are mutually exclusive
- `sealed_condition` only applies when card's `product_type` is a sealed type
- Graded sealed products are allowed (CGC grades boxes, BGS grades packs)
- Graded cards require both `grading_company` and `grade`

### `messages` table
```
id           uuid PK
listing_id   uuid → listings  (card-scoped: thread = all msgs on a listing between two users)
sender_id    uuid → auth.users
receiver_id  uuid → auth.users
content      text
created_at   timestamptz
read_at      timestamptz      -- null = unread
```

RLS: only sender and receiver can read/write their messages.

---

## Photo Links (listings)

- No image uploads. Users paste external URLs (Imgur, Google Drive, OneDrive, Dropbox, Discord CDN, personal sites, etc.)
- Stored as `photo_links text[]` on listings, soft-limit ~10 with warning
- `photo_notes text` optional field alongside photos
- UI: section titled "Photos (optional)" with help tooltip; each link is a text input + Remove button; "+ Add another link" button
- Live preview: if URL ends in `.jpg/.png/.webp/.gif` → small thumbnail; otherwise → link card showing domain
- On listing detail: direct images embed inline (click to enlarge); non-image URLs shown as clickable cards with "Opens in new tab"
- Always `target="_blank" rel="noopener noreferrer"` on external links
- Use `referrerpolicy="no-referrer"` on embedded images
- URL sanitization: only allow `https://` (or `http://`); reject `javascript:` and `data:` URIs
- Help modal: recommend Imgur, mention Google Drive/OneDrive/Dropbox/Discord/Instagram, remind users links must be public

---

## Authentication (built and working)

- Email + password primary
- Magic link as secondary / password recovery option
- Email confirmation required before login
- No social logins in v1
- Supabase Auth with `@supabase/ssr` for cookie-based sessions
- Session refreshed on every request via `proxy.ts` (Next.js 16 renamed middleware → proxy)

---

## Card Data — TCGdex Import

- Source: TCGdex (tcgdex.dev) — free, open source, full DB on GitHub
- Strategy: one-time import script runs locally, populates `cards` table
- Runtime: zero external API calls for card data in production
- Re-sync: monthly Supabase Edge Function cron to pick up new sets (upsert — never overwrites existing)
- Import script: `scripts/import-tcgdex.ts` — run with `npm run import:tcgdex`
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (uses service role to bypass RLS)
- Import is idempotent — safe to re-run

---

## Build Progress

| Step | Status |
|------|--------|
| Project setup (Node, git, Next.js) | ✅ Done |
| Supabase client wired up | ✅ Done |
| Auth (signup, login, magic link, signout) | ✅ Done — tested in browser |
| Database schema SQL | ❌ Needs rewrite to match specs above |
| TCGdex import script | ⚠️ Written but references old schema — needs update after schema rewrite |
| Database migrated in Supabase | ❌ Not yet — pending schema rewrite |
| Card catalog imported | ❌ Not yet — pending migration |
| Listing creation | ❌ Not started |
| Public feed | ❌ Not started |
| Listing detail pages | ❌ Not started |
| User profiles | ❌ Not started |
| Messaging | ❌ Not started |

---

## Coding Conventions
- TypeScript throughout
- Next.js App Router — server components by default; `"use client"` only for interactivity/hooks
- Supabase: `@supabase/ssr` for cookie-based auth in Next.js
- Environment variables: never commit `.env.local` — use `.env.local.example` as template
- Tailwind only for styling
- One component per file, small and focused
- No comments explaining what code does — only why, when non-obvious
- No error handling for impossible scenarios — trust the DB constraints and type system

---

## Developer Context
Zero prior coding background, comfortable with Linux/terminal.
Explain commands before running them. Wait for confirmation between major steps.
