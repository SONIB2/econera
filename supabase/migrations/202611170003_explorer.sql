insert into public.categories (slug, name) values
  ('beton', 'Beton'),
  ('xham', 'Dritare dhe xham'),
  ('cati', 'Çati dhe mbulim')
on conflict (slug) do nothing;

create table public.availability_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null references public.categories(slug),
  region text check (region in ('Berat','Dibër','Durrës','Elbasan','Fier','Gjirokastër','Korçë','Kukës','Lezhë','Shkodër','Tiranë','Vlorë')),
  details text not null check (char_length(btrim(details)) between 10 and 600),
  created_at timestamptz not null default now(),
  unique nulls not distinct (owner_id, category, region, details)
);

alter table public.availability_requests enable row level security;
revoke all on public.availability_requests from public, anon, authenticated;
grant select on public.availability_requests to authenticated;
grant insert (category, region, details) on public.availability_requests to authenticated;
create policy availability_read_own on public.availability_requests for select to authenticated
  using (owner_id = (select auth.uid()));
create policy availability_create_own on public.availability_requests for insert to authenticated
  with check (owner_id = (select auth.uid()));
create index availability_owner_recent on public.availability_requests(owner_id, created_at desc);
