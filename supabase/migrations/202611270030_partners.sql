-- 0030: partner management.
-- Applications (leads with source 'partner') get a review status; official partners live in their own table and
-- appear publicly only when staff publish them after recording the formal confirmation. Nothing is created
-- automatically from an application. Reversible: see docs/RECOVERY.md (drop the table, the bucket and the columns).

-- 1. Review status on applications ---------------------------------------------------------------
alter table public.leads
  add column if not exists status text not null default 'new' check (status in ('new','info_requested','approved','rejected')),
  add column if not exists review_note text check (review_note is null or length(review_note) <= 1000),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id);

-- Partner-support staff (support or super admin, with MFA) can read applications and change only the review fields.
grant select on public.leads to authenticated;
grant update (status, review_note, reviewed_at, reviewed_by) on public.leads to authenticated;
create policy leads_staff_read on public.leads for select to authenticated using (public.has_staff_role(array['support']));
create policy leads_staff_review on public.leads for update to authenticated
  using (public.has_staff_role(array['support'])) with check (public.has_staff_role(array['support']));

-- 2. Official partners --------------------------------------------------------------------------
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  category text not null check (category in ('supplier','manufacturer','construction','architecture','logistics','institution','other')),
  description_sq text check (description_sq is null or length(description_sq) <= 600),
  description_en text check (description_en is null or length(description_en) <= 600),
  website text check (website is null or website ~ '^https://[^\s]{3,200}$'),
  logo_path text check (logo_path is null or length(logo_path) <= 300),
  logo_authorized boolean not null default false,
  application_id uuid references public.leads(id) on delete set null,
  confirmation_ref text not null check (length(btrim(confirmation_ref)) between 3 and 200),
  confirmed_on date not null,
  published boolean not null default false,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A logo is shown only with the partner's permission recorded.
  check (logo_path is null or logo_authorized)
);
create index partners_published_idx on public.partners (published, name);

alter table public.partners enable row level security;
revoke all on public.partners from public, anon, authenticated;
grant select on public.partners to anon, authenticated;
grant insert, update, delete on public.partners to authenticated;
create policy partners_public on public.partners for select to anon using (published);
create policy partners_signed_in on public.partners for select to authenticated
  using (published or public.has_staff_role(array['support']));
create policy partners_staff_insert on public.partners for insert to authenticated with check (public.has_staff_role(array['support']));
create policy partners_staff_update on public.partners for update to authenticated
  using (public.has_staff_role(array['support'])) with check (public.has_staff_role(array['support']));
create policy partners_staff_delete on public.partners for delete to authenticated using (public.has_staff_role(array['support']) and not published);

-- Every change is written to the append-only audit log.
create function public.partners_audited() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  perform public.audit('partner.' || lower(tg_op), 'partner', coalesce(new.id, old.id)::text,
    jsonb_build_object('name', coalesce(new.name, old.name), 'published', coalesce(new.published, false)));
  return coalesce(new, old);
end; $$;
create trigger partners_audit before insert or update or delete on public.partners for each row execute function public.partners_audited();

create function public.leads_reviewed() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now(); new.reviewed_by := (select auth.uid());
    perform public.audit('partner_application.' || new.status, 'lead', new.id::text, '{}'::jsonb);
  end if;
  return new;
end; $$;
create trigger leads_review_audit before update on public.leads for each row execute function public.leads_reviewed();

-- 3. Logos: public bucket, images only, 1 MB, written only by partner-support staff --------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('partner-logos', 'partner-logos', true, 1048576, array['image/png','image/webp','image/jpeg'])
      on conflict (id) do nothing;
    execute $p$create policy partner_logos_write on storage.objects for insert to authenticated
      with check (bucket_id = 'partner-logos' and public.has_staff_role(array['support']))$p$;
    execute $p$create policy partner_logos_delete on storage.objects for delete to authenticated
      using (bucket_id = 'partner-logos' and public.has_staff_role(array['support']))$p$;
  end if;
end $$;
