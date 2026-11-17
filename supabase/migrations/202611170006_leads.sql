-- Waitlist / letter-of-interest registrations from /kontakt and /furnitore.
-- RLS is on with no policies: only the server (secret key) can read or write.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company text not null check (char_length(company) between 2 and 120),
  nipt text not null default '' check (nipt = '' or nipt ~ '^[A-Z][0-9]{8}[A-Z]$'),
  contact text not null check (char_length(contact) between 2 and 80),
  email text not null check (char_length(email) <= 160 and position('@' in email) > 1),
  phone text not null default '' check (char_length(phone) <= 30),
  role text not null check (role in ('furnitor', 'kontraktor', 'transportues', 'zhvillues', 'tjeter')),
  city text not null check (char_length(city) between 2 and 60),
  interest text not null check (interest in ('ka', 'kerkon', 'te_dyja')),
  materials text not null check (char_length(materials) between 3 and 1000),
  source text not null check (source in ('kontakt', 'furnitore')),
  consent_at timestamptz not null
);

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
