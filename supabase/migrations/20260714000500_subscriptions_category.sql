-- Dedicated "Subscriptions" category, matching Amex's own label, instead of
-- splitting these across Fun and Bills & Utilities.

insert into categories (key, name, emoji, color, is_budgetable)
values ('subscriptions', 'Subscriptions', '🔔', '#38bdf8', true)
on conflict (key) do nothing;

update category_rules
set category_id = (select id from categories where key = 'subscriptions')
where pattern in ('netflix', 'spotify', 'apple.com', 'msbill.info', 'microsoft', 'anthropic', 'vpn nz');

insert into category_rules (pattern, category_id)
select 'takeprofittrader', id from categories where key = 'subscriptions'
on conflict (pattern) do update set category_id = excluded.category_id;
