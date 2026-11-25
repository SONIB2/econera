-- AI tools: saved projects (renovation, basket, smartcut) per account, and sheet/offcut fields on listings.
-- Apply in Supabase → SQL editor. Until then the app keeps projects in the browser and ignores offcut columns.

create table public.tool_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('renovim','shporta','smartcut')),
  title text not null check (length(btrim(title)) between 1 and 160),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tool_projects enable row level security;
create policy tool_projects_own on public.tool_projects for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create index tool_projects_owner_idx on public.tool_projects (owner_id, updated_at desc);

-- Offcuts and sheets: rectangular dimensions in millimetres, optional colour.
alter table public.materials
  add column length_mm numeric check (length_mm is null or length_mm between 1 and 20000),
  add column width_mm numeric check (width_mm is null or width_mm between 1 and 20000),
  add column thickness_mm numeric check (thickness_mm is null or thickness_mm between 0.1 and 500),
  add column sheet_material text check (sheet_material is null or sheet_material in ('MDF','Kompensatë','OSB','Laminat','Granit','Mermer','Xham','Metal','Dru')),
  add column color text check (color is null or length(color) <= 40);
grant insert (length_mm, width_mm, thickness_mm, sheet_material, color), update (length_mm, width_mm, thickness_mm, sheet_material, color)
  on public.materials to authenticated;

create or replace view public.public_catalogue with (security_barrier = true, security_invoker = false) as
  select id,title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment,created_at,updated_at,
         masonry_type,seller_label,length_mm,width_mm,thickness_mm,sheet_material,color
  from public.materials
  where publication = 'published' and moderation = 'approved' and quantity > 0;
revoke all on public.public_catalogue from public, anon, authenticated;
grant select on public.public_catalogue to anon, authenticated;
