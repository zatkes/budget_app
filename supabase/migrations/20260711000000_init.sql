-- Core schema for Sim & Lucia's finance app.
-- Matches the plan in twinkly-humming-glacier.md section 2.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type owner_scope as enum ('joint', 'sim', 'lucia');
create type individual_scope as enum ('sim', 'lucia');
create type account_type as enum ('checking', 'savings', 'loan', 'credit', 'investment', 'kiwisaver');
create type akahu_connection_type as enum ('official_open_banking', 'direct');
create type akahu_connection_status as enum ('active', 'reauth_required', 'revoked');
create type advisor_run_status as enum ('pending', 'success', 'failed');
create type risk_tier as enum ('low', 'medium', 'high');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_initials text not null,
  scope individual_scope not null unique,
  created_at timestamptz not null default now()
);

-- Returns the calling user's scope ('sim' or 'lucia'), used by every
-- owner_scope-aware RLS policy below.
create or replace function current_user_scope()
returns individual_scope
language sql
stable
security definer
set search_path = public
as $$
  select scope from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  emoji text not null,
  color text not null
);

create table akahu_category_map (
  akahu_category_key text primary key,
  category_id uuid not null references categories (id)
);

create table app_settings (
  key text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- Akahu connections & synced accounts
-- ---------------------------------------------------------------------------

create table akahu_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  akahu_item_id text unique,
  access_token_ciphertext text not null,
  encryption_iv text not null,
  institution_name text not null,
  connection_type akahu_connection_type not null,
  status akahu_connection_status not null default 'active',
  transactions_cursor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger akahu_connections_set_updated_at
  before update on akahu_connections
  for each row execute function set_updated_at();

create table accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references akahu_connections (id) on delete set null,
  akahu_account_id text unique,
  name text not null,
  type account_type not null,
  owner_scope owner_scope not null default 'joint',
  current_balance numeric(14, 2) not null default 0,
  available_balance numeric(14, 2),
  is_manual boolean not null default true,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger accounts_set_updated_at
  before update on accounts
  for each row execute function set_updated_at();

create table balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  as_of timestamptz not null default now(),
  current_balance numeric(14, 2) not null
);
create index balance_snapshots_account_as_of_idx on balance_snapshots (account_id, as_of desc);

-- Positive = income, negative = expense - normalise Akahu's sign convention
-- to this at write time, never leak Akahu's raw sign into the app layer.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  akahu_transaction_id text unique,
  pending boolean not null default false,
  merchant_name text,
  description text,
  amount numeric(14, 2) not null,
  occurred_on date not null,
  akahu_category jsonb,
  category_id uuid references categories (id),
  emoji_override text,
  is_manual boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transactions_account_date_idx on transactions (account_id, occurred_on desc);
create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

create table securities (
  id uuid primary key default gen_random_uuid(),
  ticker_symbol text,
  name text not null,
  asset_class text not null default 'stock'
);

create table holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  security_id uuid not null references securities (id),
  quantity numeric(18, 6) not null default 0,
  cost_basis numeric(14, 2),
  current_value numeric(14, 2) not null default 0,
  updated_at timestamptz not null default now()
);
create trigger holdings_set_updated_at
  before update on holdings
  for each row execute function set_updated_at();

create table portfolio_value_snapshots (
  id uuid primary key default gen_random_uuid(),
  as_of date not null,
  owner_scope owner_scope not null,
  total_value numeric(14, 2) not null,
  unique (as_of, owner_scope)
);

-- ---------------------------------------------------------------------------
-- User-entered
-- ---------------------------------------------------------------------------

create table budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id),
  period_month date not null,
  limit_amount numeric(14, 2) not null,
  unique (category_id, period_month)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  target_amount numeric(14, 2) not null,
  target_date date,
  owner_scope owner_scope not null default 'joint',
  linked_account_id uuid references accounts (id),
  manual_saved_amount numeric(14, 2),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table mortgages (
  id uuid primary key default gen_random_uuid(),
  owner_scope owner_scope not null default 'joint',
  lender_name text,
  current_balance numeric(14, 2) not null,
  annual_rate numeric(6, 4) not null,
  monthly_payment numeric(14, 2) not null,
  original_loan_amount numeric(14, 2),
  origination_date date,
  linked_account_id uuid references accounts (id),
  is_manual boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger mortgages_set_updated_at
  before update on mortgages
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- AI Advisor
-- ---------------------------------------------------------------------------

create table advisor_watchlist (
  id uuid primary key default gen_random_uuid(),
  ticker text not null unique,
  name text,
  asset_class text not null default 'stock',
  active boolean not null default true
);

create table advisor_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null default 'scheduled',
  model text,
  input_snapshot jsonb,
  status advisor_run_status not null default 'pending',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create table stock_picks (
  id uuid primary key default gen_random_uuid(),
  advisor_run_id uuid not null references advisor_runs (id) on delete cascade,
  ticker text not null,
  name text,
  asset_class text not null default 'stock',
  reasoning text,
  risk_tier risk_tier not null,
  confidence_pct int not null check (confidence_pct between 0 and 100),
  sparkline_points jsonb,
  created_at timestamptz not null default now()
);
create index stock_picks_run_idx on stock_picks (advisor_run_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table categories enable row level security;
alter table akahu_category_map enable row level security;
alter table app_settings enable row level security;
alter table akahu_connections enable row level security;
alter table accounts enable row level security;
alter table balance_snapshots enable row level security;
alter table transactions enable row level security;
alter table securities enable row level security;
alter table holdings enable row level security;
alter table portfolio_value_snapshots enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;
alter table mortgages enable row level security;
alter table advisor_watchlist enable row level security;
alter table advisor_runs enable row level security;
alter table stock_picks enable row level security;

-- profiles: both partners can see each other's name/initials; each can only
-- edit their own row.
create policy "profiles are readable by any signed-in user" on profiles
  for select to authenticated using (true);
create policy "profiles are editable by their owner" on profiles
  for update to authenticated using (id = auth.uid());

-- Shared reference/config data: both partners read and manage it. Advisor
-- output and the watchlist are written only by the cron jobs (service role,
-- which bypasses RLS) - no authenticated-role write policy is defined for
-- those, so the app can read but never write them directly.
create policy "categories are readable" on categories
  for select to authenticated using (true);
create policy "categories are writable" on categories
  for all to authenticated using (true) with check (true);

create policy "category map is readable" on akahu_category_map
  for select to authenticated using (true);

create policy "app settings are readable" on app_settings
  for select to authenticated using (true);
create policy "app settings are writable" on app_settings
  for all to authenticated using (true) with check (true);

create policy "budgets are readable" on budgets
  for select to authenticated using (true);
create policy "budgets are writable" on budgets
  for all to authenticated using (true) with check (true);

create policy "securities are readable" on securities
  for select to authenticated using (true);

create policy "advisor watchlist is readable" on advisor_watchlist
  for select to authenticated using (true);

create policy "advisor runs are readable" on advisor_runs
  for select to authenticated using (true);

create policy "stock picks are readable" on stock_picks
  for select to authenticated using (true);

-- akahu_connections: only the linking partner can see their own connection
-- (it holds the encrypted access token).
create policy "connections are owner-only" on akahu_connections
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- owner_scope-aware tables: readable/writable when the row is 'joint' or
-- matches the signed-in partner's own scope.
create policy "accounts are scoped" on accounts
  for all to authenticated
  using (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text)
  with check (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text);

create policy "goals are scoped" on goals
  for all to authenticated
  using (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text)
  with check (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text);

create policy "mortgages are scoped" on mortgages
  for all to authenticated
  using (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text)
  with check (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text);

create policy "portfolio snapshots are scoped" on portfolio_value_snapshots
  for select to authenticated
  using (owner_scope = 'joint' or owner_scope::text = current_user_scope()::text);

-- Tables scoped indirectly via their parent account's owner_scope.
create policy "balance snapshots follow their account" on balance_snapshots
  for select to authenticated
  using (exists (
    select 1 from accounts a
    where a.id = balance_snapshots.account_id
      and (a.owner_scope = 'joint' or a.owner_scope::text = current_user_scope()::text)
  ));

create policy "transactions follow their account" on transactions
  for all to authenticated
  using (exists (
    select 1 from accounts a
    where a.id = transactions.account_id
      and (a.owner_scope = 'joint' or a.owner_scope::text = current_user_scope()::text)
  ))
  with check (exists (
    select 1 from accounts a
    where a.id = transactions.account_id
      and (a.owner_scope = 'joint' or a.owner_scope::text = current_user_scope()::text)
  ));

create policy "holdings follow their account" on holdings
  for select to authenticated
  using (exists (
    select 1 from accounts a
    where a.id = holdings.account_id
      and (a.owner_scope = 'joint' or a.owner_scope::text = current_user_scope()::text)
  ));

-- ---------------------------------------------------------------------------
-- Table-level grants
-- ---------------------------------------------------------------------------
-- This project has "Automatically expose new tables" turned off, so these
-- grants are explicit rather than default. The RLS policies above are the
-- real access control - a grant only lets the `authenticated` role reach a
-- table at all; RLS still decides which rows, and still blocks writes on
-- tables with no matching insert/update policy (e.g. stock_picks,
-- advisor_runs - written only by the service role, which bypasses RLS).
-- Nothing is granted to `anon`: every policy above is `to authenticated`,
-- and this app has no unauthenticated data.

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- service_role (used server-side by the seed script and future cron jobs)
-- bypasses RLS, but still needs these ordinary grants to touch tables at
-- all now that tables aren't auto-exposed.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
