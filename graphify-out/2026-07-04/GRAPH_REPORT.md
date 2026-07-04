# Graph Report - /Users/matthewpark/Downloads/current-projects/rolodex  (2026-07-04)

## Corpus Check
- Corpus is ~43,133 words - fits in a single context window. You may not need a graph.

## Summary
- 450 nodes · 873 edges · 24 communities (21 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.75)
- Token cost: 199,774 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 29 edges
2. `createClient()` - 24 edges
3. `Button` - 23 edges
4. `compilerOptions` - 17 edges
5. `getPeople()` - 15 edges
6. `Person` - 15 edges
7. `Input` - 12 edges
8. `requireUserId()` - 10 edges
9. `Badge()` - 9 edges
10. `getPerson()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `CalendarPage()` --calls--> `getPeople()`  [EXTRACTED]
  app/people/calendar/page.tsx → lib/people/queries.ts
- `DashboardLayout()` --calls--> `createClient()`  [EXTRACTED]
  app/people/layout.tsx → lib/supabase/server.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
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

## Communities (24 total, 3 thin omitted)

### Community 0 - "Auth Pages & Flows"
Cohesion: 0.08
Nodes (32): ForgotPasswordForm(), GoalRow(), GoalsPanel(), GoalsPanelProps, LoginForm(), LinksField(), LinksFieldProps, FieldProps (+24 more)

### Community 1 - "Ask, Goals & Person Pages"
Cohesion: 0.06
Nodes (36): AskPageProps, metadata, GoalsPage(), metadata, PersonPage(), OverviewPage(), AskNetwork(), AskNetworkProps (+28 more)

### Community 2 - "People Routes & Actions"
Cohesion: 0.10
Nodes (31): GET(), Home(), AllPeoplePage(), EditPersonPage(), TagsPage(), PeopleBrowser(), ActionState, askNetworkAction() (+23 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, boring-avatars, browser-image-compression, class-variance-authority, clsx, framer-motion, fuse.js, @hookform/resolvers (+32 more)

### Community 4 - "Layouts & Brand Components"
Cohesion: 0.07
Nodes (26): DashboardLayout(), AuthButton(), BeryMark(), BeryMarkProps, BeryWordmark(), BeryWordmarkProps, isActive(), MAIN_NAV (+18 more)

### Community 5 - "Research Chat & Gemini Client"
Cohesion: 0.10
Nodes (26): DraftFieldProps, EMPTY_DRAFT, ResearchState, ChatTurn, extractText(), GeminiCandidate, generateGrounded(), generateJson() (+18 more)

### Community 6 - "Network Pages & GitHub Enrichment"
Cohesion: 0.10
Nodes (23): NetworkPage(), fetchGithubFacts(), getUser(), GithubFacts, GithubUser, headers(), loginFromUrl(), searchTopUser() (+15 more)

### Community 7 - "Calendar & People Browser"
Cohesion: 0.11
Nodes (23): CalendarPage(), MetCalendar(), MetCalendarProps, monthLabel(), pad(), WEEKDAYS, PeopleBrowserProps, PALETTE (+15 more)

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
Cohesion: 0.19
Nodes (14): Private avatars Storage Bucket ({user_id}/{uuid}.webp), Client-side 512px WebP Resize Before Upload, fuse.js Client-side Search, supabase/migrations/0001_init.sql Schema Migration, Next.js 16 App Router + RSC, people Table (owner-scoped data model), PWA Add-to-Home-Screen Install, Rolodex Personal CRM (+6 more)

### Community 12 - "OpenGraph Starter Image"
Cohesion: 0.39
Nodes (8): Cookie-based Auth with Next.js App Router, Embedded Starter App Landing Page Screenshot, Next.js, Next.js Starter Kit Template Branding, OpenGraph Social Share Image (Next.js Starter Kit), Rolodex Personal CRM App, Supabase, Supabase Auth Helpers Docs

### Community 13 - "Twitter Card Starter Image"
Cohesion: 0.43
Nodes (7): Cookie-based Supabase Auth with Next.js App Router, Getting Started Resource Cards, Starter Kit Landing Page Screenshot, Next.js, Next.js Starter Kit Template Branding, Twitter/OG Social Share Card, Supabase

### Community 15 - "AI Enrichment Design Principles"
Cohesion: 0.47
Nodes (6): Anti-fabrication Grounding (URLs never invented, LLM restricted to GitHub facts), Auto-fill with AI Enrichment Agent, Fill Empty Fields Only, Append Links/Tags (never clobber user input), Gemini Flash (role/tags/notes inference), GitHub Public API (real facts source), Optional Server-only API Keys (GEMINI_API_KEY, GITHUB_TOKEN)

### Community 16 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): fraunces, geistSans, metadata

### Community 17 - "ESLint Config"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

## Knowledge Gaps
- **141 isolated node(s):** `metadata`, `geistSans`, `fraunces`, `metadata`, `AskPageProps` (+136 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Auth Pages & Flows` to `Starter Tutorial Components`, `Layouts & Brand Components`, `Research Chat & Gemini Client`, `Calendar & People Browser`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Button` connect `Auth Pages & Flows` to `Ask, Goals & Person Pages`, `People Routes & Actions`, `Layouts & Brand Components`, `Research Chat & Gemini Client`, `Calendar & People Browser`, `Starter Tutorial Components`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `createClient()` connect `People Routes & Actions` to `Ask, Goals & Person Pages`, `Layouts & Brand Components`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `metadata`, `geistSans`, `fraunces` to the rest of the system?**
  _144 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Pages & Flows` be split into smaller, more focused modules?**
  _Cohesion score 0.08076923076923077 - nodes in this community are weakly interconnected._
- **Should `Ask, Goals & Person Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.06386066763425254 - nodes in this community are weakly interconnected._
- **Should `People Routes & Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.1048780487804878 - nodes in this community are weakly interconnected._