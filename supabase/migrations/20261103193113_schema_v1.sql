-- Schema v1 (Phase 3): profiles, the AniList connection and its encrypted
-- token. Later phases add their tables (entry_prefs, series_prefs,
-- feed_events, calendar_feeds, push_subscriptions) with their own RLS and
-- tests (PLAN.md §8).

-- ---------------------------------------------------------------------------
-- public.profiles: your settings. Created automatically on sign-up.
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id          uuid primary key references auth.users on delete cascade,
  title_language   text not null default 'english'
                   check (title_language in ('english', 'romaji', 'native')),
  show_adult       boolean not null default false,
  timezone         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own row: select" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own row: update" on public.profiles
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- Only the settings columns can be changed from the app.
grant update (title_language, show_adult, timezone) on public.profiles
  to authenticated;

create function public.touch_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create function public.create_profile_for_new_user() returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.create_profile_for_new_user()
  from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- ---------------------------------------------------------------------------
-- public.anilist_connections: who you are on AniList. You can read it; only
-- the server (secret key) writes it.
-- ---------------------------------------------------------------------------
create table public.anilist_connections (
  user_id          uuid primary key references auth.users on delete cascade,
  anilist_user_id  integer not null unique,
  anilist_name     text not null,
  score_format     text not null,
  expires_at       timestamptz not null,
  connected_at     timestamptz not null default now()
);

alter table public.anilist_connections enable row level security;

create policy "own row: select" on public.anilist_connections
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.anilist_connections from anon, authenticated;
grant select on public.anilist_connections to authenticated;

-- ---------------------------------------------------------------------------
-- private: not exposed through the Data API. Only the server reaches it,
-- through the functions below (granted to service_role only).
-- ---------------------------------------------------------------------------
create schema private;
revoke all on schema private from public, anon, authenticated;

create table private.anilist_tokens (
  user_id          uuid primary key references auth.users on delete cascade,
  ciphertext       bytea not null,          -- AES-256-GCM; the key exists only in server env
  nonce            bytea not null,
  expires_at       timestamptz not null,
  updated_at       timestamptz not null default now()
);

-- A second lock: RLS on, no policies.
alter table private.anilist_tokens enable row level security;
revoke all on private.anilist_tokens from public, anon, authenticated;

create function public.save_anilist_token(
  p_user_id uuid,
  p_ciphertext bytea,
  p_nonce bytea,
  p_expires_at timestamptz
) returns void
  language sql
  security definer
  set search_path = ''
as $$
  insert into private.anilist_tokens (user_id, ciphertext, nonce, expires_at)
  values (p_user_id, p_ciphertext, p_nonce, p_expires_at)
  on conflict (user_id) do update
    set ciphertext = excluded.ciphertext,
        nonce = excluded.nonce,
        expires_at = excluded.expires_at,
        updated_at = now();
$$;

create function public.get_anilist_token(p_user_id uuid)
  returns table (ciphertext bytea, nonce bytea, expires_at timestamptz)
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select ciphertext, nonce, expires_at
  from private.anilist_tokens
  where user_id = p_user_id;
$$;

create function public.delete_anilist_token(p_user_id uuid) returns void
  language sql
  security definer
  set search_path = ''
as $$
  delete from private.anilist_tokens where user_id = p_user_id;
$$;

revoke execute on function public.save_anilist_token(uuid, bytea, bytea, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.get_anilist_token(uuid)
  from public, anon, authenticated;
revoke execute on function public.delete_anilist_token(uuid)
  from public, anon, authenticated;
grant execute on function public.save_anilist_token(uuid, bytea, bytea, timestamptz)
  to service_role;
grant execute on function public.get_anilist_token(uuid) to service_role;
grant execute on function public.delete_anilist_token(uuid) to service_role;
