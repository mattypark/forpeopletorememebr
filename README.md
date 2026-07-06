<p align="center">
  <img src="brand/bery-mark-1024.png" alt="Bery" width="80" />
</p>

<h1 align="center">bery.</h1>

<p align="center"><strong>Everyone you meet, remembered.</strong></p>

Bery is an AI agent that remembers everyone you meet — who they are, where you
met, what they can help you with — and recalls the right person the moment you
need them.

## Why Bery is different

Every other tool in this space is either a **sales CRM wearing a personal
skin** (Clay, Folk, Dex, Covve) or a **contacts app with search**. They all
make the same two bets: relationships are managed on a *cadence* ("follow up
every 30 days"), and data comes from *syncing your accounts* (OAuth into your
email, calendar, LinkedIn). Bery bets differently, four ways:

### 1. Intent-first recall, not cadence
The question that actually matters isn't "who haven't I talked to lately" —
it's **"who do I know that can help with THIS?"** Bery is built around that
question. Every person carries *what you need them for*, and the **Ask** page
ranks your own network against any goal ("who can intro me to a designer?",
"who was building in real-estate tech?"). Your network becomes a queryable
memory, not a to-do list.

### 2. Capture in one sentence, agent does the rest
Other tools make you fill forms or connect accounts. In Bery you type one
line — *"met Yurii at the YC dinner, cracked SWE, founder in NYC"* — and the
agent researches the public web (GitHub API + Gemini grounded search + an
anti-bot scraper for profile pages) and hands you a filled profile: role,
company, links, tags, even what you said you need them for. Twenty seconds
per person, no OAuth, no permissions to your inbox.

### 3. Context a feed can't give you: where, when, how many times
Bery remembers the *human* metadata that makes memory work — **where you met
(on a real map)**, how you met, how many times you've met since. LinkedIn
knows their job title; only you know you met them twice at Washington Square
Park. That context is the difference between a contact and a relationship.

### 4. Private by architecture, not by policy
Single-user by design. Row-level security on every row, avatars in a private
bucket, no account syncing, no selling your graph. What you know about your
people is yours.

**One sentence:** Bery is a second brain for people — capture anyone in
seconds, see your network on a map, and ask it for the right person when it
matters.

---

## Stack

- **Next.js 16** (App Router, RSC) + **TypeScript**
- **Supabase** — Postgres (RLS) + private Storage + Auth
- **AI agent** — Gemini Flash (grounded search) + GitHub API + Scrapling
  sidecar (`scraper/`, FastAPI + anti-bot fetching) for deep profile scrapes
- **MapLibre GL** + free Carto tiles, Nominatim geocoding (no API keys)
- **Tailwind** + shadcn-style UI · Fraunces display / Geist body · framer-motion

## One-time setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then copy from
**Project Settings → API**: Project URL + Publishable key.

### 2. Env

```bash
cp .env.example .env.local
```

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Optional (each unlocks a feature, everything degrades gracefully):
`GEMINI_API_KEY`, `GITHUB_TOKEN`, `SCRAPER_URL` + `SCRAPER_TOKEN`,
`NEXT_PUBLIC_SITE_URL` (production auth emails).

### 3. Schema

Run each file in `supabase/migrations/` (0001 → 0004) in the Supabase
**SQL Editor**, in order. Or `supabase db push` with the CLI linked.

### 4. Auth URLs (production)

Supabase → **Authentication → URL Configuration**:

- Site URL: your production URL
- Redirect URLs: `https://<your-domain>/**` and `http://localhost:3000/**`

### 5. Run

```bash
npm run dev            # app on :3000
cd scraper && ./run.sh # optional deep-scrape sidecar on :8787
```

## Features

| Surface | What it does |
|---|---|
| **Overview** | Stats, recently met, reconnect nudges, act-on-today panel |
| **People** | Cards with photo, needs, tags; fuzzy search + tag filters |
| **Ask** | Intent search — rank your people against any need |
| **Map** | Every person dotted where you met them; hover → who it is |
| **Goals** | Active goals matched against your network |
| **Research** | Chat agent: describe a person → researched draft profile |
| **Networks** | GitHub / LinkedIn / X / Instagram views with direct profile links + follower stats |
| **Onboarding** | First-login questions that tailor the experience |

## Scraper sidecar (optional)

`scraper/` is a FastAPI service using Scrapling for anti-bot page fetches
(profile pages, Instagram follower counts). Local: `./run.sh setup && ./run.sh`.
Production: deploy the included `Dockerfile` (Render/Railway/Fly), set
`SCRAPER_TOKEN` on both sides, point `SCRAPER_URL` at it. Without it the agent
still works via Gemini + GitHub.

## Phone / PWA

Ships a manifest + icons — **Add to Home Screen** installs it as a standalone
app. Offline caching later via `@serwist/next`.

## Brand

Vision, palette, and logo pack live in [`brand/`](brand/BRAND.md).
Cream paper `#F9F6F0` · Ink `#1C1512` · Strawberry `#CE2241`.

## Roadmap

- **iMessage capture** — text Bery a sentence about someone you just met; the
  agent files them (next up)
- Stripe paywall (placeholder built, disabled)
- Follow-up nudges from goals, offline PWA cache
