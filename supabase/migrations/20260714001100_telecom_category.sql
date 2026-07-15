insert into categories (key, name, emoji, color, is_budgetable, is_transfer)
values ('telecom', 'Telecom', '📱', '#818cf8', true, false)
on conflict (key) do nothing;

-- Spark/One NZ were folded into Bills & Utilities earlier - pull them out
-- into their own category now that it exists.
update category_rules
set category_id = (select id from categories where key = 'telecom')
where pattern in ('spark', 'one nz');
