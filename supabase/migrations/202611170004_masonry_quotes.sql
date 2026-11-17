alter table public.materials
  add column masonry_type text check (masonry_type is null or
    (category = 'guri' and masonry_type in ('clay','hollow','reclaimed','block'))),
  add column seller_label text check (seller_label is null or char_length(btrim(seller_label)) between 2 and 80);

grant insert (masonry_type, seller_label), update (masonry_type, seller_label)
  on public.materials to authenticated;

create or replace function public.track_material_edit() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  if row(new.title,new.description,new.category,new.region,new.condition,new.unit,new.quantity,
         new.unit_price,new.currency,new.fulfillment,new.masonry_type,new.seller_label) is distinct from
     row(old.title,old.description,old.category,old.region,old.condition,old.unit,old.quantity,
         old.unit_price,old.currency,old.fulfillment,old.masonry_type,old.seller_label) then
    new.publication := 'draft';
    new.moderation := 'unreviewed';
    new.revision := old.revision + 1;
  end if;
  return new;
end;
$$;

create or replace view public.public_catalogue with (security_barrier = true, security_invoker = false) as
  select id,title,description,category,region,condition,unit,quantity,unit_price,currency,fulfillment,created_at,updated_at,
    masonry_type,seller_label
  from public.materials
  where publication = 'published' and moderation = 'approved' and quantity > 0;

create index materials_masonry_catalogue_idx on public.materials (masonry_type, created_at desc, id)
  where category = 'guri' and publication = 'published' and moderation = 'approved' and quantity > 0;

create table public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id),
  buyer_id uuid not null references auth.users(id),
  seller_id uuid not null references auth.users(id),
  material_title text not null,
  quantity numeric not null check (quantity > 0 and quantity <= 10000000 and scale(quantity) <= 3),
  unit text not null,
  fulfillment text not null check (fulfillment in ('pickup','delivery')),
  message text not null check (char_length(btrim(message)) between 10 and 1000),
  created_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);
create unique index quotation_duplicate_idx on public.quotation_requests(buyer_id, material_id, quantity, fulfillment, md5(message));
create index quotation_buyer_recent_idx on public.quotation_requests(buyer_id, created_at desc);
create index quotation_seller_recent_idx on public.quotation_requests(seller_id, created_at desc);
alter table public.quotation_requests enable row level security;
revoke all on public.quotation_requests from public, anon, authenticated;
grant select on public.quotation_requests to authenticated;
create policy quotation_participant_read on public.quotation_requests for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

create function public.request_quotation(listing_id uuid, requested_quantity numeric, requested_fulfillment text, buyer_message text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  buyer uuid := auth.uid();
  listing public.materials%rowtype;
  request_id uuid;
begin
  if buyer is null or requested_quantity is null or requested_quantity <= 0 or
     requested_quantity > 10000000 or scale(requested_quantity) > 3 or
     requested_fulfillment is null or requested_fulfillment not in ('pickup','delivery') or
     buyer_message is null or char_length(btrim(buyer_message)) not between 10 and 1000 then
    return null;
  end if;

  select id into request_id from public.quotation_requests
   where buyer_id = buyer and material_id = listing_id and quantity = requested_quantity
     and fulfillment = requested_fulfillment and message = btrim(buyer_message);
  if request_id is not null then return request_id; end if;

  select * into listing from public.materials where id = listing_id for share;
  if not found or listing.owner_id = buyer or listing.publication <> 'published' or
     listing.moderation <> 'approved' or listing.quantity < requested_quantity or
     listing.fulfillment not in ('both', requested_fulfillment) then
    return null;
  end if;

  insert into public.quotation_requests
    (material_id,buyer_id,seller_id,material_title,quantity,unit,fulfillment,message)
  values (listing.id,buyer,listing.owner_id,listing.title,requested_quantity,listing.unit,requested_fulfillment,btrim(buyer_message))
  on conflict do nothing
  returning id into request_id;

  if request_id is null then
    select id into request_id from public.quotation_requests
     where buyer_id = buyer and material_id = listing_id and quantity = requested_quantity
       and fulfillment = requested_fulfillment and message = btrim(buyer_message);
  end if;
  return request_id;
end;
$$;
revoke all on function public.request_quotation(uuid,numeric,text,text) from public, anon, authenticated;
grant execute on function public.request_quotation(uuid,numeric,text,text) to authenticated;
