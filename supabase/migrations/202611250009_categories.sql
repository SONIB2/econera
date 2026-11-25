-- Marketplace categories for the redesigned market (Browse by material). Existing slugs are kept.
insert into public.categories (slug, name) values
  ('struktura', 'Materiale strukturore'), ('fasade', 'Fasadë'), ('hidraulike', 'Hidraulikë'), ('elektrike', 'Instalime elektrike'),
  ('hvac', 'Ngrohje, ventilim, kondicionim'), ('suva', 'Suva dhe gipskarton'), ('boje', 'Bojë dhe përfundime'),
  ('jashte', 'Punime të jashtme'), ('vegla', 'Vegla dhe pajisje'), ('mobilje', 'Mobilie dhe interier'), ('sanitari', 'Sanitari')
on conflict (slug) do nothing;

-- Structural materials default to high risk; electrical and HVAC to medium (staff can change it).
create or replace function public.default_risk(category text, intended_use text) returns text
language sql immutable as $$
  select case
    when intended_use in ('structural','fire_safety','electrical','pressure') or category = 'struktura' then 'high'
    when category in ('metal','guri','dyer','izolim','elektrike','hvac','hidraulike','xham','beton','cati','sanitari') then 'medium'
    else 'low' end
$$;
