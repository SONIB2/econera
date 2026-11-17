create table public.categories (
  slug text primary key,
  name text not null
);
insert into public.categories values
  ('dru', 'Dru dhe parket'), ('qeramike', 'Pllaka dhe qeramikë'),
  ('guri', 'Gur dhe muraturë'), ('metal', 'Metal dhe profile'),
  ('dyer', 'Dyer dhe dritare'), ('izolim', 'Izolim dhe panele');

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  title text not null check (length(btrim(title)) between 4 and 100),
  description text not null check (length(btrim(description)) between 12 and 2000),
  category text not null references public.categories(slug),
  region text not null check (region in ('Berat','Dibër','Durrës','Elbasan','Fier','Gjirokastër','Korçë','Kukës','Lezhë','Shkodër','Tiranë','Vlorë')),
  condition text not null check (condition in ('unused','reusable')),
  unit text not null check (unit in ('copë','m','m²','m³','kg','ton','paletë')),
  quantity numeric not null check (quantity between 0 and 10000000 and scale(quantity) <= 3),
  unit_price numeric not null check (unit_price between 0 and 10000000 and scale(unit_price) <= 2),
  currency text not null check (currency in ('ALL','EUR')),
  fulfillment text not null check (fulfillment in ('pickup','delivery','both')),
  publication text not null default 'draft' check (publication in ('draft','published','archived')),
  moderation text not null default 'unreviewed' check (moderation in ('unreviewed','pending','approved','rejected')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publication <> 'published' or moderation = 'approved')
);
create index materials_owner_idx on public.materials (owner_id, updated_at desc);
create index materials_catalogue_idx on public.materials (created_at desc, id) where publication = 'published' and moderation = 'approved' and quantity > 0;
create index materials_review_idx on public.materials (updated_at) where moderation = 'pending';

create table public.platform_admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.moderation_events (
  id bigint generated always as identity primary key,
  material_id uuid not null references public.materials(id),
  administrator_id uuid not null references auth.users(id),
  revision integer not null,
  decision text not null check (decision in ('approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.materials enable row level security;
alter table public.platform_admins enable row level security;
alter table public.moderation_events enable row level security;

revoke all on public.categories, public.materials, public.platform_admins, public.moderation_events from public, anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.materials to authenticated;
grant insert (title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment),
      update (title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment)
  on public.materials to authenticated;

create policy category_read on public.categories for select to anon, authenticated using (true);
create policy inventory_create on public.materials for insert to authenticated with check (owner_id = (select auth.uid()));
create policy inventory_edit on public.materials for update to authenticated
  using (owner_id = (select auth.uid()) and publication <> 'archived')
  with check (owner_id = (select auth.uid()));

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.platform_admins where user_id = (select auth.uid())) $$;
revoke all on function public.is_platform_admin() from public, anon, authenticated;
grant execute on function public.is_platform_admin() to authenticated;

create policy inventory_read on public.materials for select to authenticated
  using (owner_id = (select auth.uid()) or ((select public.is_platform_admin()) and moderation = 'pending'));

create function public.track_material_edit() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  if row(new.title,new.description,new.category,new.region,new.condition,new.unit,new.quantity,
         new.unit_price,new.currency,new.fulfillment) is distinct from
     row(old.title,old.description,old.category,old.region,old.condition,old.unit,old.quantity,
         old.unit_price,old.currency,old.fulfillment) then
    new.publication := 'draft';
    new.moderation := 'unreviewed';
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;
create trigger track_material_edit before update on public.materials
for each row execute function public.track_material_edit();

create function public.change_material_state(material_id uuid, expected_revision integer, intent text) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if intent = 'submit' then
    update public.materials set moderation = 'pending'
      where id = material_id and owner_id = (select auth.uid()) and revision = expected_revision
        and publication = 'draft' and moderation in ('unreviewed','rejected') and quantity > 0;
  elsif intent = 'unpublish' then
    update public.materials set publication = 'draft', moderation = 'unreviewed', revision = revision + 1
      where id = material_id and owner_id = (select auth.uid()) and revision = expected_revision
        and (publication = 'published' or moderation = 'pending');
  elsif intent = 'archive' then
    update public.materials set publication = 'archived', moderation = 'unreviewed', revision = revision + 1
      where id = material_id and owner_id = (select auth.uid()) and revision = expected_revision
        and publication <> 'archived';
  else
    return false;
  end if;
  return found;
end;
$$;

create function public.review_material(material_id uuid, expected_revision integer, verdict text) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_platform_admin() or verdict is null or verdict not in ('approved','rejected') then
    return false;
  end if;
  update public.materials
    set moderation = verdict, publication = case when verdict = 'approved' then 'published' else 'draft' end,
        revision = revision + 1
    where id = material_id and revision = expected_revision and publication = 'draft' and moderation = 'pending';
  if not found then return false; end if;
  insert into public.moderation_events (material_id, administrator_id, revision, decision)
    values (material_id, auth.uid(), expected_revision, verdict);
  return true;
end;
$$;

revoke all on function public.change_material_state(uuid, integer, text), public.review_material(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.change_material_state(uuid, integer, text), public.review_material(uuid, integer, text)
  to authenticated;

create view public.public_catalogue with (security_barrier = true, security_invoker = false) as
  select id,title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment,created_at,updated_at
  from public.materials
  where publication = 'published' and moderation = 'approved' and quantity > 0;
revoke all on public.public_catalogue from public, anon, authenticated;
grant select on public.public_catalogue to anon, authenticated;
