-- Rename "Pets" to "Millie" (the dog's actual name).
update categories set name = 'Millie' where key = 'pets';

-- New category for chemist/beauty/health spend - this was defaulting into
-- "Shopping" and was quietly hiding ~$1,000/cycle of real spend.
insert into categories (key, name, emoji, color, is_budgetable)
values ('health_beauty', 'Health & Beauty', '💊', '#e879f9', true)
on conflict (key) do nothing;

-- Re-point the chemist warehouse rule (seeded earlier under Shopping) to
-- the new category, and add the rest of the health/beauty merchants.
update category_rules
set category_id = (select id from categories where key = 'health_beauty')
where pattern = 'chemist warehouse';

insert into category_rules (pattern, category_id)
select pattern, c.id from (values
  ('ellis jones', 'health_beauty'),
  ('sephora', 'health_beauty'),
  ('im8 health', 'health_beauty'),
  ('tbi pukekohe', 'health_beauty')
) as starter(pattern, category_key)
join categories c on c.key = starter.category_key
where not exists (
  select 1 from category_rules cr where cr.pattern = starter.pattern
);
