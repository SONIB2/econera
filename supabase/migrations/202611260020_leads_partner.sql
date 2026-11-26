-- Partnership applications from /partneret reuse the leads table with source 'partner'.
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check check (source in ('kontakt', 'furnitore', 'partner'));
