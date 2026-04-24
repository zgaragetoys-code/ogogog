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
- **Pricing API:** None, ever. Users set their own prices.
- **Stripe:** Env vars reserved for possible future one-off payments (e.g. automating featured listing purchases). Not integrated, no subscription products.

---

## Hosting Philosophy
Stay within free tiers. Prefer free-at-small-scale over more scalable but paid.

---

## Monetization Strategy — Manual Only Until Scale Justifies Automation

### Featured listings (v1 — manual flow)
- `/feature-your-listing` — static page explaining the offer: "Want your listing seen by more collectors? Email [contact] with your listing URL. Rate: $X/7 days, $Y/30 days." (rates TBD)
- `/featured` — public page showing all currently-featured listings
- `is_featured boolean` + `featured_until timestamptz` columns on `listings` table
- Featured listings appear in the main feed at roughly every 5th position, visually distinct with a "Featured" badge
- `/admin/featured` — admin-only route to manually toggle `is_featured` and set `featured_until`. Access controlled by `ADMIN_EMAIL` env variable — only that logged-in email sees the UI
- No automated payment flow. Owner manually sets featured status after payment is confirmed offline.

### Display ads (future — not building yet)
- Planned eventually via Ezoic or Mediavine once traffic justifies it
- Ad placement slots **architecturally reserved** in feed and sidebar layouts but **left empty in implementation**
- When building feed and layout components, include the slot divs with a comment but render nothing inside them

### What is NOT monetized
- No premium tier, no subscription gating, no paid features
- All features are free for all users
- No Stripe subscription products, no pricing page, no tier comparison UI

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
11. `/featured` and `/feature-your-listing` static pages
12. `/admin/featured` admin route

### Explicitly out of scope for v1
- Payment processing (users pay each other via PayPal G&S)
- Image uploads (external URLs only)
- Pricing API integration
- Collectr CSV import (v2)
- Automated buy/sell matching engine (v2)
- Seller/buyer rating system (v2)
- Premium subscriptions or paid tiers (never — all features free)
- Multi-TCG support
- Mobile native apps
- Deck building tools
- Escrow or card authentication services
- Social logins (Google/GitHub) — can add later

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
id                   uuid PK → auth.users
username             text UNIQUE
display_name         text
avatar_seed          text
avatar_style         text
country, region      text
notes                text
collectr_url, etc.   text   -- social/marketplace links
global_chat_enabled  boolean DEFAULT true   -- added in migration 013
created_at, updated_at
```

### `listings` table
```
id                        uuid PK
user_id                   uuid → auth.users
card_id                   text → cards
listing_type              enum: 'for_sale' | 'wanted'
condition_type            enum: 'raw' | 'graded' | 'sealed'
raw_condition             enum: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'
sealed_condition          enum: 'factory_sealed' | 'sealed_no_outer_wrap'
                                | 'opened_contents_sealed' | 'opened_partial' | 'damaged'
grading_company           enum: 'PSA' | 'CGC' | 'BGS' | 'SGC'
grade                     numeric(4,1)   -- 1.0–10.0, supports half grades
price                     numeric(10,2)
notes                     text
photo_links               text[]
photo_notes               text
master_set_completion     enum: '100_percent' | 'near_complete' | 'partial'
master_set_included_cards text
is_featured               boolean DEFAULT false
featured_until            timestamptz
status                    enum: 'active' | 'pending' | 'sold' | 'cancelled'
created_at, updated_at
```

**Key constraints:** raw_condition and grading_company mutually exclusive; sealed_condition
only on sealed product types; graded sealed products allowed (CGC boxes etc.);
graded requires both company and grade.

### `messages` table
```
id           uuid PK
listing_id   uuid → listings
sender_id    uuid → auth.users
receiver_id  uuid → auth.users
content      text
created_at   timestamptz
read_at      timestamptz   -- null = unread
```

RLS: only sender and receiver can read/write their messages.

### `global_chat_messages` table (migration 013)
```
id         uuid PK
user_id    uuid → auth.users
content    text CHECK 1–280 chars
created_at timestamptz
deleted_at timestamptz   -- null = visible (soft delete)
deleted_by uuid → auth.users
```
RLS: anyone reads non-deleted; authenticated can insert (user_id = auth.uid()); owner can update (soft-delete).
Realtime enabled on INSERT. 10-second cooldown enforced server-side in chat/actions.ts.
Profanity filter: `lib/moderation.ts` — normalises leetspeak substitutions then checks against BLOCKED word list.

### `bookmarks` table (migration 014)
```
id          uuid PK
user_id     uuid → auth.users
target_type text CHECK IN ('listing', 'user')
target_id   text          -- listing UUID or user UUID
created_at  timestamptz
UNIQUE (user_id, target_type, target_id)
```
RLS: authenticated users manage own rows only. `toggleBookmark()` server action in app/bookmarks/actions.ts.

---

## Photo Links (listings)

- No image uploads. Users paste external URLs (Imgur, Google Drive, OneDrive, Dropbox, Discord CDN, etc.)
- Stored as `photo_links text[]`, soft-limit ~10 with warning
- `photo_notes text` optional field
- On listing detail: direct image URLs (`.jpg/.png/.webp/.gif`) embed inline with click-to-enlarge; other URLs shown as link cards with domain + "Opens in new tab"
- Always `target="_blank" rel="noopener noreferrer"` on external links
- `referrerpolicy="no-referrer"` on embedded images
- URL sanitization: only `http://` or `https://`; reject `javascript:` and `data:` URIs

---

## Authentication (built and working)

- Email + password primary; magic link as secondary/recovery
- Email confirmation required before login
- No social logins in v1
- Supabase Auth with `@supabase/ssr` for cookie-based sessions
- Session refreshed on every request via `proxy.ts` (Next.js 16 renamed middleware → proxy)

---

## Card Data — TCGdex Import (complete)

- 23,159 cards across 208 sets imported into Supabase
- Import script: `scripts/import-tcgdex.ts` — run with `npm run import:tcgdex`
- Re-sync plan: monthly Supabase Edge Function cron (upsert — never overwrites existing data)
- Phase 2 enrichment (rarity, types, hp) deferred — not a v1 blocker

---

## Build Progress

| Step | Status |
|------|--------|
| Project setup (Node, git, Next.js) | ✅ Done |
| Supabase client wired up | ✅ Done |
| Auth (signup, login, magic link, signout) | ✅ Done |
| Database schema (migrations 001–017) | ✅ Done — all run in Supabase |
| TCGdex card catalog import | ✅ Done — 23,159 cards |
| pokemontcg.io image enrichment | ✅ Done |
| TypeScript database types | ✅ Done — types/database.ts |
| Card search component | ✅ Done — components/CardSearch.tsx |
| Listing creation — catalog + custom items | ✅ Done — app/listings/new/ |
| Edit/cancel listings | ✅ Done — app/listings/[id]/edit/ |
| Mark as sold | ✅ Done |
| Public browse feed (real-time) | ✅ Done — app/browse/ |
| Listing detail pages | ✅ Done — app/listings/[id]/ |
| Share button on cards + detail page | ✅ Done — components/ShareButton.tsx |
| User profiles | ✅ Done — app/u/[username]/ |
| Messaging (per-listing threads) | ✅ Done — app/messages/ |
| /featured + /feature-your-listing | ✅ Done |
| /admin/featured | ✅ Done |
| /admin/users | ✅ Done |
| Collection items | ✅ Done — app/collection/ |
| Community seed users | ✅ Done — `npm run seed:community` |
| Global chat | ✅ Done — app/chat/, realtime, moderation, cooldown |
| Bookmarks (listings + users) | ✅ Done — app/bookmarks/, components/BookmarkButton.tsx |
| Chat in Messages tab | ✅ Done |
| Global chat toggle in profile | ✅ Done |
| Bot system (migration 015) | ✅ Done — 1000 bots seeded |
| /admin/bots page | ✅ Done — paginated, toggles, bulk controls |
| Bot tick cron | ✅ Done — /api/bots/tick, daily cron via vercel.json |
| Discussion board (migration 016) | ✅ Done — app/board/ |
| Site-wide profanity filter | ✅ Done |
| Condition color coding (browse) | ✅ Done |
| Relative timestamps (browse) | ✅ Done |
| Integration test suite | ✅ Done — `npm run test` (42 tests) |
| Custom domain | ✅ Done — www.ogogog-marketplace.com (canonical) |
| Production deployment | ✅ Live — https://www.ogogog-marketplace.com |

---

## Coding Conventions
- TypeScript throughout
- Next.js App Router — server components by default; `"use client"` only for interactivity/hooks
- Supabase: `@supabase/ssr` for cookie-based auth in Next.js
- Environment variables: never commit `.env.local` — template in `.env.local.example`
- Tailwind only for styling — no separate CSS files
- One component per file, small and focused
- No comments explaining what code does — only why, when non-obvious
- No error handling for impossible scenarios — trust DB constraints and type system
- Ad placement slots: include empty `<div>` with comment in feed/layout, render nothing

---

## Environment Variables

All set in Vercel production dashboard. Local dev uses `.env.local`.

```
NEXT_PUBLIC_SUPABASE_URL          — Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — Supabase anon/publishable key
NEXT_PUBLIC_SITE_URL              — https://www.ogogog-marketplace.com (production) / http://localhost:3000 (local)
SUPABASE_SERVICE_ROLE_KEY         — Secret, server/script only
ADMIN_EMAIL                       — zgarage.toys@gmail.com — only this email gets /admin access
BOT_TICK_SECRET                   — Secret for manual admin bot tick (x-bot-secret header)
CRON_SECRET                       — Vercel cron authorization (Authorization: Bearer header)
STRIPE_SECRET_KEY                 — Reserved, not yet used
STRIPE_PUBLISHABLE_KEY            — Reserved, not yet used
```

## Hosting & Domain

- **Production URL**: https://www.ogogog-marketplace.com (canonical)
- **Apex redirect**: ogogog-marketplace.com → www (308)
- **Vercel project**: ogogog (zgaragetoys-9952s-projects)
- **Deploy command**: `npx vercel --prod`
- **DNS**: Cloudflare (nameservers: mia.ns.cloudflare.com, wesley.ns.cloudflare.com)

## Bot System

- **1000 bots seeded** across 7 personalities: casual, hype, vintage, competitive, sealed, grader, investor
- **Tick route**: `/api/bots/tick` — POST requires `x-bot-secret` header; GET requires `Authorization: Bearer ${CRON_SECRET}`
- **Tick logic**: `lib/bots/tick.ts` — shared between route and admin server action (no HTTP self-call)
- **Cron**: `vercel.json` fires daily at noon UTC (Hobby plan limit)
- **Admin UI**: `/admin/bots` — paginated 50/page, individual toggles, bulk enable/disable N bots
- **Manual tick**: `/admin/bots` → "Fire N bots" button triggers immediately
- **Bot messages**: indistinguishable from real users in chat UI (no bot label)

---

## Developer Context
Zero prior coding background, comfortable with Linux/terminal.
Explain commands before running them. Wait for confirmation between major steps.

## Accounts

**Admin:** zgarage.toys@gmail.com — use for admin access and testing.

**Community seed accounts** (managed by Claude, maintained to look alive):

| Username | Display Name | Focus |
|---|---|---|
| jordancollects | Jordan M. | Vintage Base Set, raw/graded singles |
| karentradesvtg | Karen C. | Competitive cards, modern sets |
| sealedvault | Marcus W. | Sealed products (ETBs, booster boxes) |
| pixelpokemon88 | Sam R. | Casual/budget, accessories |
| nightshadecards | Alex P. | High-end PSA/CGC graded cards |

Run `npm run seed:community` to create or refresh these accounts. To keep the site feeling active, periodically update their listings (mark some sold, add new ones) via the admin panel or direct DB updates.

## Card Images

Cards have image URLs from two sources (stored in `cards.image_url`):
- **TCGdex CDN** (`assets.tcgdex.net`) — primary source from `npm run import:tcgdex`
- **pokemontcg.io** (`images.pokemontcg.io`) — fallback for sets TCGdex lacks images for (`npm run enrich:images`)

`listing_image_url` on a listing always takes priority over the card's default image. Users can override any card image by pasting a URL when creating/editing a listing.
