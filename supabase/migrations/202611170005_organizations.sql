create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  region text check (region in ('Berat','Dibër','Durrës','Elbasan','Fier','Gjirokastër','Korçë','Kukës','Lezhë','Shkodër','Tiranë','Vlorë')),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members(user_id, organization_id);
create unique index organization_single_owner_idx on public.organization_members(organization_id) where role = 'owner';

create table public.organization_invitations (
  token_hash bytea primary key,
  organization_id uuid not null references public.organizations(id),
  email text not null check (char_length(email) between 3 and 254),
  issued_by uuid not null references auth.users(id),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;

revoke all on public.organizations, public.organization_members, public.organization_invitations from public, anon, authenticated;
grant select on public.organizations, public.organization_members to authenticated;

create policy organization_members_own on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()));

create policy organizations_member_read on public.organizations for select to authenticated
  using (exists (
    select 1 from public.organization_members member
    where member.organization_id = organizations.id and member.user_id = (select auth.uid())
  ));

create function public.create_organization(organization_name text, organization_region text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  organization uuid;
begin
  if not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null) then
    return null;
  end if;
  insert into public.organizations(name, region)
    values (btrim(organization_name), nullif(btrim(organization_region), '')) returning id into organization;
  insert into public.organization_members(organization_id, user_id, role)
    values (organization, actor, 'owner');
  return organization;
end;
$$;

create function public.issue_organization_invitation(target_organization uuid, recipient text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  token uuid := gen_random_uuid();
  address text := lower(btrim(recipient));
begin
  if address is null or char_length(address) > 254 or address !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or not exists (
    select 1 from public.organization_members
    where organization_id = target_organization and user_id = actor and role = 'owner'
  ) or not exists (select 1 from auth.users where id = actor and email_confirmed_at is not null) then
    return null;
  end if;
  insert into public.organization_invitations(token_hash, organization_id, email, issued_by)
    values (sha256(convert_to(token::text, 'UTF8')), target_organization, address, actor);
  return token;
end;
$$;

create function public.accept_organization_invitation(invitation_code uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  address text;
  invite public.organization_invitations%rowtype;
begin
  select lower(email) into address from auth.users where id = actor and email_confirmed_at is not null;
  if address is null then return null; end if;

  select * into invite from public.organization_invitations
    where token_hash = sha256(convert_to(invitation_code::text, 'UTF8')) and email = address
      and expires_at > now() and accepted_at is null
    for update;
  if not found then return null; end if;

  insert into public.organization_members(organization_id, user_id, role)
    values (invite.organization_id, actor, 'member') on conflict (organization_id, user_id) do nothing;
  update public.organization_invitations set accepted_at = now() where token_hash = invite.token_hash;
  return invite.organization_id;
end;
$$;

revoke all on function public.create_organization(text,text), public.issue_organization_invitation(uuid,text), public.accept_organization_invitation(uuid)
  from public, anon, authenticated;
grant execute on function public.create_organization(text,text), public.issue_organization_invitation(uuid,text), public.accept_organization_invitation(uuid)
  to authenticated;
