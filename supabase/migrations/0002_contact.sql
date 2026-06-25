-- Add direct contact fields to people.
alter table public.people
  add column if not exists email text,
  add column if not exists phone text;
