-- Row-level security and data isolation (PLAN.md §8). Runs with
-- `supabase test db` (in CI); everything rolls back at the end.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

-- Two users. The sign-up trigger gives each a profile.
insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'a@example.test', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.test', 'authenticated', 'authenticated');

insert into public.anilist_connections
  (user_id, anilist_user_id, anilist_name, score_format, expires_at)
values
  ('11111111-1111-1111-1111-111111111111', 101, 'UserA', 'POINT_10_DECIMAL', now() + interval '1 year'),
  ('22222222-2222-2222-2222-222222222222', 202, 'UserB', 'POINT_100', now() + interval '1 year');

select public.save_anilist_token(
  '11111111-1111-1111-1111-111111111111', '\x0102'::bytea, '\x0304'::bytea,
  now() + interval '1 year');

-- ---------------------------------------------------------------------------
-- Guards: every table has RLS, and private is out of reach.
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from pg_tables
   where schemaname in ('public', 'private') and not rowsecurity),
  0,
  'every table in public and private has row-level security enabled');

select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon cannot use the private schema');
select ok(
  not has_schema_privilege('authenticated', 'private', 'usage'),
  'authenticated cannot use the private schema');

select ok(
  not has_function_privilege('authenticated', 'public.get_anilist_token(uuid)', 'execute'),
  'signed-in users cannot read tokens');
select ok(
  not has_function_privilege('anon', 'public.save_anilist_token(uuid, bytea, bytea, timestamptz)', 'execute'),
  'anonymous users cannot write tokens');
select ok(
  has_function_privilege('service_role', 'public.get_anilist_token(uuid)', 'execute'),
  'the server can read tokens');

select is(
  (select count(*)::int from public.profiles),
  2,
  'signing up creates a profile');

-- ---------------------------------------------------------------------------
-- As user A.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select results_eq(
  'select user_id::text from public.profiles',
  $$values ('11111111-1111-1111-1111-111111111111')$$,
  'A sees only their own profile');

select lives_ok(
  $$update public.profiles set title_language = 'romaji'
    where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'A can change their own settings');

select is(
  (select title_language from public.profiles
   where user_id = '11111111-1111-1111-1111-111111111111'),
  'romaji',
  'the change was saved');

update public.profiles set show_adult = true
  where user_id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select show_adult from public.profiles
   where user_id = '22222222-2222-2222-2222-222222222222'),
  false,
  'A cannot change B''s settings');
set local role authenticated;
set local request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

select throws_ok(
  $$update public.profiles set created_at = now()
    where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'only the settings columns can be changed');

select throws_ok(
  $$insert into public.profiles (user_id)
    values ('33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null,
  'profiles cannot be created from the app');

select results_eq(
  'select anilist_name from public.anilist_connections',
  $$values ('UserA')$$,
  'A sees only their own AniList connection');

select throws_ok(
  $$update public.anilist_connections set anilist_name = 'Changed'$$,
  '42501',
  null,
  'the AniList connection cannot be changed from the app');

select throws_ok(
  $$insert into public.anilist_connections
      (user_id, anilist_user_id, anilist_name, score_format, expires_at)
    values ('11111111-1111-1111-1111-111111111111', 999, 'X', 'POINT_10', now())$$,
  '42501',
  null,
  'the AniList connection cannot be created from the app');

select throws_ok(
  $$select * from private.anilist_tokens$$,
  '42501',
  null,
  'signed-in users cannot read the token table');

select throws_ok(
  $$select * from public.get_anilist_token('11111111-1111-1111-1111-111111111111')$$,
  '42501',
  null,
  'signed-in users cannot call the token functions');

-- ---------------------------------------------------------------------------
-- As user B.
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

select results_eq(
  'select anilist_name from public.anilist_connections',
  $$values ('UserB')$$,
  'B sees only their own AniList connection');

select is(
  (select count(*)::int from public.profiles
   where user_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'B cannot see A''s profile');

-- ---------------------------------------------------------------------------
-- Anonymous visitors see nothing.
-- ---------------------------------------------------------------------------
reset role;
set local role anon;

select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'anon cannot read profiles');
select throws_ok(
  'select * from public.anilist_connections',
  '42501',
  null,
  'anon cannot read AniList connections');

-- ---------------------------------------------------------------------------
-- Deleting a user removes their rows from every table with a user_id.
-- ---------------------------------------------------------------------------
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

create function pg_temp.rows_left(target uuid) returns int
  language plpgsql
as $$
declare
  t record;
  total int := 0;
  n int;
begin
  for t in
    select table_schema, table_name from information_schema.columns
    where column_name = 'user_id' and table_schema in ('public', 'private')
  loop
    execute format('select count(*) from %I.%I where user_id = $1',
                   t.table_schema, t.table_name)
      into n using target;
    total := total + n;
  end loop;
  return total;
end;
$$;

select is(
  pg_temp.rows_left('11111111-1111-1111-1111-111111111111'),
  0,
  'deleting a user leaves no rows behind in any table');

select is(
  pg_temp.rows_left('22222222-2222-2222-2222-222222222222') > 0,
  true,
  'other users keep their rows');

select * from finish();
rollback;
