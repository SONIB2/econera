-- 0040: interest registrations from the product roadmap page reuse the leads table with source 'roadmap'.
-- Reversible: delete from public.leads where source = 'roadmap'; then restore the 0020 constraint.
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check check (source in ('kontakt', 'furnitore', 'partner', 'roadmap'));
