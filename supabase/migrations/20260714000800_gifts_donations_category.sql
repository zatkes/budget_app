insert into categories (key, name, emoji, color, is_budgetable)
values ('gifts_donations', 'Gifts & Donations', '🎁', '#fda4af', true)
on conflict (key) do nothing;
