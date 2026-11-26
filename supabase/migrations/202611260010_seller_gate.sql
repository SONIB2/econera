-- 0010: a listing can be submitted for review only by a seller whose account was approved by ECONERA staff.
-- Same function as 0008 with one added check; drafts are unaffected. Product approval stays a separate human review.
create or replace function public.change_material_state(material_id uuid, expected_revision integer, intent text) returns boolean
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare m public.materials%rowtype;
begin
  if intent = 'submit' then
    -- Only sellers whose account ECONERA staff approved may send listings for review (drafts stay allowed).
    if not exists (select 1 from public.seller_verifications v where v.user_id = (select auth.uid()) and v.status = 'approved') then
      return false;
    end if;
    update public.materials set moderation = 'pending', submitted_at = now(),
           risk_level = coalesce(risk_level, public.default_risk(category, intended_use))
      where id = material_id and owner_id = (select auth.uid()) and revision = expected_revision
        and publication = 'draft' and moderation in ('unreviewed','rejected','info_required') and quantity > 0
      returning * into m;
    if not found then return false; end if;
    insert into public.material_versions (material_id, revision, data, submitted_by)
      values (m.id, m.revision, to_jsonb(m) - 'assigned_to', (select auth.uid()))
      on conflict (material_id, revision) do update set data = excluded.data, submitted_at = now();
    perform public.audit('listing.submitted', 'material', m.id::text, jsonb_build_object('revision', m.revision, 'risk', m.risk_level));
    perform public.notify(m.owner_id, 'listing.submitted', m.id::text, jsonb_build_object('title', m.title));
    perform public.notify_staff(array['product_officer'], 'staff.listing_case', m.id::text, jsonb_build_object('title', m.title, 'risk', m.risk_level));
    return true;
  elsif intent = 'unpublish' then
    update public.materials set publication = 'draft', moderation = 'unreviewed', revision = revision + 1
      where id = material_id and owner_id = (select auth.uid()) and revision = expected_revision
        and (publication in ('published','expired') or moderation in ('pending','under_review','info_required','inspection_required','escalated'));
  elsif intent = 'archive' then
    update public.materials set publication = 'archived', moderation = 'unreviewed', revision = revision + 1
      where id = material_id and owner_id = (select auth.uid()) and revision = expected_revision
        and publication not in ('archived','suspended');
  else
    return false;
  end if;
  if found then perform public.audit('listing.' || intent, 'material', material_id::text, jsonb_build_object('revision', expected_revision)); end if;
  return found;
end;
$$;

