-- Real-life category restructure + a new "upcoming bills" feature for
-- irregular expenses (council rates, rego, WOF, car services) that the
-- monthly category budget doesn't capture.

-- ---------------------------------------------------------------------------
-- Categories: mark which ones count towards the discretionary budget screen.
-- Fixed obligations (mortgage/loan repayments) are still categorised for
-- Activity/reporting but excluded from the Budget screen's limit tracking.
-- ---------------------------------------------------------------------------

alter table categories add column if not exists is_budgetable boolean not null default true;

update categories set is_budgetable = false where key in ('income', 'transfer', 'uncategorized');

update categories
set key = 'vehicle', name = 'Vehicle', emoji = '🚗', color = '#60a5fa'
where key = 'transport';

insert into categories (key, name, emoji, color, is_budgetable) values
  ('pets', 'Pets', '🐾', '#fb923c', true)
on conflict (key) do nothing;

insert into categories (key, name, emoji, color, is_budgetable) values
  ('mortgage_loans', 'Mortgage & Loans', '🏠', '#94a3b8', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Recurring/irregular bills - known expenses that don't hit every month
-- (or every calendar month), tracked with an explicit next-due date so the
-- app can surface them ahead of time instead of them landing as a surprise.
-- ---------------------------------------------------------------------------

create table recurring_bills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '📅',
  category_id uuid references categories (id),
  expected_amount numeric(14, 2) not null,
  frequency_months int not null,
  next_due_on date not null,
  last_paid_on date,
  owner_scope owner_scope not null default 'joint',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger recurring_bills_set_updated_at
  before update on recurring_bills
  for each row execute function set_updated_at();

alter table recurring_bills enable row level security;

create policy "recurring bills are scoped" on recurring_bills
  for all to authenticated
  using (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text)
  with check (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text);

grant select, insert, update, delete on recurring_bills to authenticated;
grant select, insert, update, delete on recurring_bills to service_role;
