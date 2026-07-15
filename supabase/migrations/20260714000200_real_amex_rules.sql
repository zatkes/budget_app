-- Rules built from a real Amex export (Transaction Details tab). Replaces
-- guesses from the earlier migrations with exact merchant strings, and adds
-- a few new ones that only became clear from the real data.

-- Fix: real Amex formatting has no space ("THEWAREHOUSEPUKEKOHE"), so the
-- earlier 'the warehouse' rule never matched. Add the no-space form too.
insert into category_rules (pattern, category_id)
select 'thewarehouse', c.id from categories c where c.key = 'shopping'
on conflict do nothing;

insert into category_rules (pattern, category_id)
select pattern, c.id from (values
  -- Dining out - cafes and Windcave-processed food vendors
  ('esquires', 'dining_out'),
  ('st pierres', 'dining_out'),
  ('burgerfuel', 'dining_out'),
  ('cinnabon', 'dining_out'),
  ('daily bread', 'dining_out'),
  ('ganesh', 'dining_out'),
  ('majestic manaw', 'dining_out'),
  ('order meal', 'dining_out'),
  ('tank te rapa', 'dining_out'),
  ('your local bak', 'dining_out'),
  -- Shopping
  ('bendon', 'shopping'),
  ('hype nz', 'shopping'),
  ('hydroflask', 'shopping'),
  ('zara', 'shopping'),
  ('iconic', 'shopping'),
  -- Bills & utilities
  ('spark', 'bills'),
  ('tower insurance', 'bills'),
  ('towerinsurance', 'bills'),
  -- Pets - "WINDCAVE*PET DIRECT" (Amex shows it under a custom "Millie" tag,
  -- presumably the dog's name)
  ('pet direct', 'pets')
) as starter(pattern, category_key)
join categories c on c.key = starter.category_key;
