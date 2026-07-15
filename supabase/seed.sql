-- Reference data seed. Safe to re-run (upserts on conflict).
-- The 2 user accounts are seeded separately via `npm run seed:users`,
-- since creating an auth.users row requires the Admin API, not plain SQL.

insert into categories (key, name, emoji, color, is_budgetable, is_transfer, is_sinking_fund) values
  ('groceries', 'Groceries', '🥑', '#34d399', true, false, true),
  ('dining_out', 'Coffee/Dining Out', '🍜', '#fbbf6d', true, false, true),
  ('vehicle', 'Car Maintenance', '🚗', '#60a5fa', true, false, true),
  ('pets', 'Millie', '🐾', '#fb923c', true, false, true),
  ('fun', 'Fun & Entertainment', '🎉', '#c084fc', true, false, true),
  ('bills', 'Bills & Utilities', '💡', '#f472b6', true, false, false),
  ('shopping', 'Shopping', '🛍️', '#a78bfa', true, false, true),
  ('health_beauty', 'Health & Beauty', '💊', '#e879f9', true, false, true),
  ('subscriptions', 'Subscriptions', '🔔', '#38bdf8', true, false, false),
  ('gifts_donations', 'Gifts & Donations', '🎁', '#fda4af', true, false, true),
  ('tax_interest', 'Tax/Interest', '🧾', '#5eead4', true, false, true),
  ('telecom', 'Telecom', '📱', '#818cf8', true, false, false),
  ('mortgage_loans', 'Mortgage & Loans', '🏠', '#94a3b8', false, false, false),
  ('income', 'Income', '💰', '#34d399', false, false, false),
  ('transfer', 'Transfer/Petrol', '⛽', '#facc15', true, false, true),
  ('internal_transfer', 'Internal Transfer', '🔄', '#94a3b8', false, true, false),
  ('uncategorized', 'Uncategorised', '❔', '#94a3b8', false, false, false)
on conflict (key) do nothing;

-- Assumed long-term market return used by the mortgage-vs-invest tool.
-- Kept editable/disclosed rather than hardcoded, per the design spec.
insert into app_settings (key, value) values
  ('assumed_market_return', '0.07')
on conflict (key) do update set value = excluded.value;
