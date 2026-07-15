-- Additional rules seeded from a real Amex export. Only the merchants I
-- could read with confidence are included here - see the accompanying note
-- for a handful that were too garbled in the screenshot to guess safely.

insert into category_rules (pattern, category_id)
select pattern, c.id from (values
  -- Groceries
  ('pak n save', 'groceries'),
  -- Dining out
  ('mcdonald', 'dining_out'),
  ('starbucks', 'dining_out'),
  ('taco bell', 'dining_out'),
  ('tasty thai', 'dining_out'),
  -- Vehicle (petrol/parking)
  ('parkmate', 'vehicle'),
  -- Shopping
  ('chemist warehouse', 'shopping'),
  ('the iconic', 'shopping'),
  ('the warehouse', 'shopping'),
  -- Bills & utilities (power, water, telecom, software subscriptions)
  ('mercury nz', 'bills'),
  ('watercare', 'bills'),
  ('one nz', 'bills'),
  ('vpn nz', 'bills'),
  ('apple.com', 'bills'),
  ('msbill.info', 'bills'),
  ('microsoft', 'bills'),
  ('anthropic', 'bills')
) as starter(pattern, category_key)
join categories c on c.key = starter.category_key;
