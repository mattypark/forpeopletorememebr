-- Times met, where-we-met map coordinates, and cached social stats.
-- Run in the Supabase SQL editor (like 0001–0003).

alter table public.people
  add column if not exists times_met integer not null default 1,
  add column if not exists met_place text,
  add column if not exists met_lat double precision,
  add column if not exists met_lng double precision,
  add column if not exists social_stats jsonb not null default '{}'::jsonb;

comment on column public.people.times_met is 'How many times the user has met this person';
comment on column public.people.met_place is 'Free-text place where they met (geocoded into met_lat/met_lng)';
comment on column public.people.social_stats is 'Cached per-platform stats: { github: { followers, ... }, x: {...}, instagram: {...} }';
