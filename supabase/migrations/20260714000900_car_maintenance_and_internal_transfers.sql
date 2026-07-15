update categories set name = 'Car Maintenance' where key = 'vehicle';

-- Card payoffs and between-your-own-accounts transfers aren't real household
-- spend or income - they shouldn't count towards any budget, and shouldn't
-- clutter the Activity feed either.
alter table categories add column if not exists is_transfer boolean not null default false;

insert into categories (key, name, emoji, color, is_budgetable, is_transfer)
values ('internal_transfer', 'Internal Transfer', '🔄', '#94a3b8', false, true)
on conflict (key) do nothing;

insert into category_rules (pattern, category_id)
select pattern, c.id from (values
  ('payment received', 'internal_transfer'),
  ('mb transfer', 'internal_transfer')
) as starter(pattern, category_key)
join categories c on c.key = starter.category_key
on conflict (pattern) do update set category_id = excluded.category_id;
