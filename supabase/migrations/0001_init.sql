-- Rolodex — personal people CRM schema
-- Single-user model: every row is scoped to its owner via user_id + RLS.

-- ---------------------------------------------------------------------------
-- people table
-- ---------------------------------------------------------------------------
create table if not exists public.people (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name         text not null,
  role         text,                      -- their title / what they do
  company      text,
  location     text,

  needs        text,                      -- "what I need them for"
  notes        text,
  met_context  text,                      -- where / how we met
  met_at       date,

  tags         text[] not null default '{}',
  links        text[] not null default '{}',  -- social / github / web URLs

  photo_path   text,                      -- path inside the private `avatars` bucket

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tag filtering: index-backed `tags @> '{mentor}'` / `tags && '{a,b}'`.
create index if not exists people_tags_idx on public.people using gin (tags);

-- Fast "most recent first" listing per user.
create index if not exists people_user_created_idx
  on public.people (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — owner-only access
-- ---------------------------------------------------------------------------
alter table public.people enable row level security;

drop policy if exists "people_select_own" on public.people;
create policy "people_select_own" on public.people
  for select using (auth.uid() = user_id);

drop policy if exists "people_insert_own" on public.people;
create policy "people_insert_own" on public.people
  for insert with check (auth.uid() = user_id);

drop policy if exists "people_update_own" on public.people;
create policy "people_update_own" on public.people
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "people_delete_own" on public.people;
create policy "people_delete_own" on public.people
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Private avatars bucket + owner-scoped storage policies
-- Object path convention: {user_id}/{person_id}.webp
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own" on storage.objects
  for select using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
