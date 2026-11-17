create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  region text check (region in ('Berat','Dibër','Durrës','Elbasan','Fier','Gjirokastër','Korçë','Kukës','Lezhë','Shkodër','Tiranë','Vlorë'))
);

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (display_name, region), update (display_name, region) on public.profiles to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy profiles_create_own on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_edit_own on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
