-- "Transfer" was a non-budgetable system category (internal transfers between
-- your own accounts). Repurposing it to also hold petrol/parking spend means
-- it needs a real name, a real budget-category treatment, and its own look.
update categories
set name = 'Transfer/Petrol', is_budgetable = true, emoji = '⛽', color = '#facc15'
where key = 'transfer';

-- Petrol and parking move out of Vehicle, which becomes purely
-- car service/rego/WOF.
update category_rules
set category_id = (select id from categories where key = 'transfer')
where pattern in ('bp ', 'z energy', 'mobil', 'caltex', 'gull', 'parkmate');
