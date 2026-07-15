-- Merchant-keyword rules that auto-categorise transactions (from Amex, ASB,
-- GEM Visa etc.) as they come in, instead of leaving everything
-- "Uncategorised" until someone fixes it by hand.

create table category_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  category_id uuid not null references categories (id),
  created_at timestamptz not null default now()
);

alter table category_rules enable row level security;

create policy "category rules are readable and writable" on category_rules
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on category_rules to authenticated;
grant select, insert, update, delete on category_rules to service_role;

-- A handful of safe, near-universal NZ starter rules. Everything else
-- (specific cafes, the vet, dog daycare, etc.) needs to be added from your
-- own statements - these are just enough to prove the feature works.
insert into category_rules (pattern, category_id)
select pattern, c.id from (values
  ('countdown', 'groceries'),
  ('woolworths', 'groceries'),
  ('new world', 'groceries'),
  ('paknsave', 'groceries'),
  ('pak''nsave', 'groceries'),
  ('fresh choice', 'groceries'),
  ('bp ', 'vehicle'),
  ('z energy', 'vehicle'),
  ('mobil', 'vehicle'),
  ('caltex', 'vehicle'),
  ('gull', 'vehicle'),
  ('nzta', 'vehicle'),
  ('vtnz', 'vehicle'),
  ('spotify', 'fun'),
  ('netflix', 'fun')
) as starter(pattern, category_key)
join categories c on c.key = starter.category_key;
