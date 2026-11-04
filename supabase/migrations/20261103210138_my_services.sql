-- Phase 4a: your streaming services, for the list's "On my services" filter
-- (PLAN.md §10.4). Normalized service names, e.g. 'Crunchyroll'.
alter table public.profiles
  add column my_services text[] not null default '{}'
    check (cardinality(my_services) <= 30);

grant update (my_services) on public.profiles to authenticated;
