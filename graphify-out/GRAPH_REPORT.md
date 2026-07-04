# Graph Report - rolodex  (2026-07-04)

## Corpus Check
- 99 files · ~44,509 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 470 nodes · 880 edges · 42 communities (21 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ddacc77e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth Pages & Flows|Auth Pages & Flows]]
- [[_COMMUNITY_Ask, Goals & Person Pages|Ask, Goals & Person Pages]]
- [[_COMMUNITY_People Routes & Actions|People Routes & Actions]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Layouts & Brand Components|Layouts & Brand Components]]
- [[_COMMUNITY_Research Chat & Gemini Client|Research Chat & Gemini Client]]
- [[_COMMUNITY_Network Pages & GitHub Enrichment|Network Pages & GitHub Enrichment]]
- [[_COMMUNITY_Calendar & People Browser|Calendar & People Browser]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_shadcn Components Config|shadcn Components Config]]
- [[_COMMUNITY_Starter Tutorial Components|Starter Tutorial Components]]
- [[_COMMUNITY_Product Architecture Concepts|Product Architecture Concepts]]
- [[_COMMUNITY_OpenGraph Starter Image|OpenGraph Starter Image]]
- [[_COMMUNITY_Twitter Card Starter Image|Twitter Card Starter Image]]
- [[_COMMUNITY_Legacy Hero & Logos|Legacy Hero & Logos]]
- [[_COMMUNITY_AI Enrichment Design Principles|AI Enrichment Design Principles]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Auto-fill with AI Enrichment Agent|Auto-fill with AI Enrichment Agent]]
- [[_COMMUNITY_Private avatars Storage Bucket ({user_id}{uuid}.webp)|Private avatars Storage Bucket ({user_id}/{uuid}.webp)]]
- [[_COMMUNITY_Client-side 512px WebP Resize Before Upload|Client-side 512px WebP Resize Before Upload]]
- [[_COMMUNITY_Fill Empty Fields Only, Append LinksTags (never clobber user input)|Fill Empty Fields Only, Append Links/Tags (never clobber user input)]]
- [[_COMMUNITY_fuse.js Client-side Search|fuse.js Client-side Search]]
- [[_COMMUNITY_Gemini Flash (roletagsnotes inference)|Gemini Flash (role/tags/notes inference)]]
- [[_COMMUNITY_GitHub Public API (real facts source)|GitHub Public API (real facts source)]]
- [[_COMMUNITY_supabasemigrations0001_init.sql Schema Migration|supabase/migrations/0001_init.sql Schema Migration]]
- [[_COMMUNITY_Next.js 16 App Router + RSC|Next.js 16 App Router + RSC]]
- [[_COMMUNITY_people Table (owner-scoped data model)|people Table (owner-scoped data model)]]
- [[_COMMUNITY_PWA Add-to-Home-Screen Install|PWA Add-to-Home-Screen Install]]
- [[_COMMUNITY_Optional Server-only API Keys (GEMINI_API_KEY, GITHUB_TOKEN)|Optional Server-only API Keys (GEMINI_API_KEY, GITHUB_TOKEN)]]
- [[_COMMUNITY_@serwistnext Offline Caching (future)|@serwist/next Offline Caching (future)]]
- [[_COMMUNITY_Supabase (Postgres + Storage + Auth)|Supabase (Postgres + Storage + Auth)]]
- [[_COMMUNITY_Tags as Postgres text (GIN-indexed, no join table)|Tags as Postgres text[] (GIN-indexed, no join table)]]
- [[_COMMUNITY_Vercel Deployment (env vars + Supabase redirect allow-list)|Vercel Deployment (env vars + Supabase redirect allow-list)]]
- [[_COMMUNITY_Web Manifest (appmanifest.ts)|Web Manifest (app/manifest.ts)]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 30 edges
2. `createClient()` - 26 edges
3. `Button` - 23 edges
4. `compilerOptions` - 17 edges
5. `getPeople()` - 16 edges
6. `Person` - 15 edges
7. `Input` - 12 edges
8. `requireUserId()` - 10 edges
9. `Badge()` - 9 edges
10. `PersonAvatar()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DashboardLayout()` --calls--> `createClient()`  [EXTRACTED]
  app/people/layout.tsx → lib/supabase/server.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `POST()` --calls--> `createClient()`  [EXTRACTED]
  app/api/agent/route.ts → lib/supabase/server.ts
- `GET()` --calls--> `createClient()`  [EXTRACTED]
  app/auth/confirm/route.ts → lib/supabase/server.ts
- `Home()` --calls--> `createClient()`  [EXTRACTED]
  app/page.tsx → lib/supabase/server.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AI Auto-fill Enrichment Flow (GitHub facts -> Gemini inference -> non-clobbering merge)** — readme_autofill_with_ai, readme_github_public_api, readme_gemini_flash, readme_empty_fields_only_merge, readme_anti_fabrication_grounding [EXTRACTED 1.00]
- **Owner-scoped Supabase Data Layer (people table + RLS + private avatars, created by 0001_init.sql)** — readme_people_table, readme_row_level_security, readme_avatars_private_bucket, readme_migration_0001_init [EXTRACTED 1.00]
- **PWA Install Path (manifest + icons now, serwist offline later)** — readme_pwa_home_screen_install, readme_web_manifest, readme_serwist_offline_caching [EXTRACTED 1.00]
- **Supabase + Next.js starter template stack promoted by the OG image** — app_opengraph_image_nextjs_starter_kit, app_opengraph_image_supabase, app_opengraph_image_nextjs, app_opengraph_image_cookie_based_auth [EXTRACTED 1.00]

## Communities (42 total, 21 thin omitted)

### Community 0 - "Auth Pages & Flows"
Cohesion: 0.11
Nodes (21): ForgotPasswordForm(), GoalRow(), GoalsPanelProps, LoginForm(), SignUpForm(), ButtonProps, buttonVariants, Card (+13 more)

### Community 1 - "Ask, Goals & Person Pages"
Cohesion: 0.06
Nodes (36): AskPageProps, metadata, GoalsPage(), metadata, PersonPage(), OverviewPage(), AgentConsole(), AgentMatch (+28 more)

### Community 2 - "People Routes & Actions"
Cohesion: 0.09
Nodes (35): POST(), GET(), Home(), AskNetworkProps, EXAMPLES, ActionState, askNetworkAction(), AskState (+27 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, boring-avatars, browser-image-compression, class-variance-authority, clsx, framer-motion, fuse.js, @hookform/resolvers (+32 more)

### Community 4 - "Layouts & Brand Components"
Cohesion: 0.08
Nodes (27): DashboardLayout(), AuthButton(), BeryMark(), BeryMarkProps, BeryWordmark(), BeryWordmarkProps, isActive(), MAIN_NAV (+19 more)

### Community 5 - "Research Chat & Gemini Client"
Cohesion: 0.10
Nodes (26): DraftFieldProps, EMPTY_DRAFT, ResearchState, ChatTurn, extractText(), GeminiCandidate, generateGrounded(), generateJson() (+18 more)

### Community 6 - "Network Pages & GitHub Enrichment"
Cohesion: 0.13
Nodes (20): LinksField(), LinksFieldProps, fetchGithubFacts(), getUser(), GithubFacts, GithubUser, headers(), loginFromUrl() (+12 more)

### Community 7 - "Calendar & People Browser"
Cohesion: 0.07
Nodes (38): AllPeoplePage(), CalendarPage(), EditPersonPage(), NetworkPage(), TagsPage(), MetCalendar(), MetCalendarProps, monthLabel() (+30 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+12 more)

### Community 9 - "shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 10 - "Starter Tutorial Components"
Cohesion: 0.15
Nodes (8): CodeBlock(), CopyIcon(), client, create, rls, server, TutorialStep(), Checkbox

### Community 11 - "Product Architecture Concepts"
Cohesion: 0.15
Nodes (12): 1. Create a Supabase project, 2. Add your keys, 3. Apply the schema, 4. Run it, Auto-fill with AI (the agent), Data model, Deploy, forpeopletorememebr (+4 more)

### Community 12 - "OpenGraph Starter Image"
Cohesion: 0.39
Nodes (8): Cookie-based Auth with Next.js App Router, Embedded Starter App Landing Page Screenshot, Next.js, Next.js Starter Kit Template Branding, OpenGraph Social Share Image (Next.js Starter Kit), Rolodex Personal CRM App, Supabase, Supabase Auth Helpers Docs

### Community 13 - "Twitter Card Starter Image"
Cohesion: 0.43
Nodes (7): Cookie-based Supabase Auth with Next.js App Router, Getting Started Resource Cards, Starter Kit Landing Page Screenshot, Next.js, Next.js Starter Kit Template Branding, Twitter/OG Social Share Card, Supabase

### Community 16 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): fraunces, geistSans, metadata

### Community 17 - "ESLint Config"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

## Knowledge Gaps
- **164 isolated node(s):** `metadata`, `geistSans`, `fraunces`, `metadata`, `AskPageProps` (+159 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Auth Pages & Flows` to `Ask, Goals & Person Pages`, `Layouts & Brand Components`, `Research Chat & Gemini Client`, `Calendar & People Browser`, `Starter Tutorial Components`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Button` connect `Layouts & Brand Components` to `Auth Pages & Flows`, `Ask, Goals & Person Pages`, `People Routes & Actions`, `Research Chat & Gemini Client`, `Network Pages & GitHub Enrichment`, `Calendar & People Browser`, `Starter Tutorial Components`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `createClient()` connect `People Routes & Actions` to `Ask, Goals & Person Pages`, `Layouts & Brand Components`, `Calendar & People Browser`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `metadata`, `geistSans`, `fraunces` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Pages & Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.11497584541062802 - nodes in this community are weakly interconnected._
- **Should `Ask, Goals & Person Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._
- **Should `People Routes & Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.09191919191919191 - nodes in this community are weakly interconnected._