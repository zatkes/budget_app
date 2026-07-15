insert into categories (key, name, emoji, color, is_budgetable, is_transfer)
values ('tax_interest', 'Tax/Interest', '🧾', '#5eead4', true, false)
on conflict (key) do nothing;
