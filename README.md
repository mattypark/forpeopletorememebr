# Rolodex

A personal CRM for everyone you meet — their photo, socials, GitHub, **what you need them for**, tags, and notes. Single-user, built on Next.js + Supabase. Works in the browser on your Mac now and installs to your phone home screen (PWA) later.

## Stack

- **Next.js 16** (App Router, RSC) + **TypeScript**
- **Supabase** — Postgres (data) + Storage (private avatars) + Auth
- **Tailwind** + shadcn-style UI, Fraunces display / Geist body
- **fuse.js** client search, **react-hook-form** + **zod** validation

## One-time setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then open
**Project Settings → API** and copy:

- Project URL
- Publishable (anon) key

### 2. Add your keys

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

`.env.local` is gitignored — keys never get committed.

### 3. Apply the schema

Open the Supabase **SQL Editor**, paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it.
This creates the `people` table (with RLS), the `updated_at` trigger, and the
private `avatars` storage bucket with owner-scoped policies.

> Or, with the Supabase CLI linked: `supabase db push`.

### 4. Run it

```bash
npm run dev
```

Open <http://localhost:3000>, sign up, and start adding people.

## Data model

`people` rows are owner-scoped — every read/write is gated by Row Level Security
on `auth.uid()`, and avatar files live in a **private** bucket keyed by user id
(`{user_id}/{uuid}.webp`). Photos are resized to 512px WebP in the browser before
upload, so it stays on the Supabase free tier.

| Field | Purpose |
|-------|---------|
| `name`, `role`, `company`, `location` | identity |
| `needs` | **what you need them for** |
| `tags` (`text[]`, GIN-indexed) | filter chips |
| `links` (`text[]`) | any social / GitHub / web URL — platform auto-detected |
| `met_context`, `met_at` | how & when you met |
| `notes` | freeform |
| `photo_path` | path into the private `avatars` bucket |

Tags use a Postgres array (not a join table) — the right call for single-user,
low-thousands-of-rows scale. Search is client-side via fuse.js over the loaded set.

## Auto-fill with AI (the agent)

On the add/edit form, **Auto-fill with AI** turns a name into a profile draft:

- **GitHub public API** supplies *real* facts — profile URL, company, location, bio,
  blog, X handle. If you've already pasted a `github.com/...` link it uses that
  directly; otherwise it searches by name. URLs are never invented.
- **Gemini Flash** infers a short role, a few tags, and a neutral notes draft from
  those facts — and only those facts (it's told not to fabricate).

It fills **empty fields only** and appends new links/tags, so it never clobbers
what you typed. Sources and a "verify the linked profiles" warning show under the
button. Always sanity-check before saving — it's a draft, not gospel.

Both keys are **optional and server-only** (set in `.env.local`):

- `GEMINI_API_KEY` — free from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
  Without it, enrichment still returns GitHub facts.
- `GITHUB_TOKEN` — optional, raises the GitHub rate limit. Unauthenticated works
  for personal use.

## Phone / PWA

The app already ships a web manifest (`app/manifest.ts`) and is responsive, so
**Add to Home Screen** installs it as a standalone app.

**Before installing, add icons** to `public/`:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512, full-bleed for the maskable slot)

For offline caching later, add [`@serwist/next`](https://serwist.pages.dev/) —
the maintained service-worker layer. Not needed for install.

## Deploy

Push to a Git repo and import into Vercel. Add the two `NEXT_PUBLIC_SUPABASE_*`
env vars in the Vercel project settings. Add your deployed URL to Supabase
**Auth → URL Configuration** redirect allow-list.
# forpeopletorememebr
