-- Budget alerting: soft/hard threshold + pacing alerts for variable
-- categories, deviation/missing-charge alerts for fixed recurring costs, and
-- a running-balance cap for Uncategorised. Alert config lives directly on
-- categories (1:1, no separate Budget table needed) since this app already
-- has exactly one standing config per category. Periods follow the app's
-- existing 18th-17th statement cycle, not calendar months, so alerts line up
-- with what /budget and /budget/trends already show.

alter table categories add column if not exists alert_mode text not null default 'none'
  check (alert_mode in ('threshold', 'fixed_expected', 'balance_cap', 'none'));
alter table categories add column if not exists soft_threshold_pct numeric not null default 0.8;
alter table categories add column if not exists hard_threshold_pct numeric not null default 1.0;
alter table categories add column if not exists is_trial boolean not null default false;

-- One row per category per cycle, tracking which alerts have already fired
-- so the same threshold doesn't re-notify every time it's re-evaluated.
create table budget_period_alerts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  soft_fired boolean not null default false,
  hard_fired boolean not null default false,
  pacing_fired boolean not null default false,
  fixed_deviation_fired boolean not null default false,
  created_at timestamptz not null default now(),
  unique (category_id, period_start)
);

alter table budget_period_alerts enable row level security;
create policy "budget period alerts are readable and writable" on budget_period_alerts
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on budget_period_alerts to authenticated;
grant select, insert, update, delete on budget_period_alerts to service_role;

-- Durable history of every alert ever fired, so the app can show a "recent
-- alerts" list independent of whatever the push notification said.
create table alert_log (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete cascade,
  alert_type text not null check (alert_type in ('soft', 'hard', 'pacing', 'fixed_deviation', 'balance_cap')),
  fired_at timestamptz not null default now(),
  spend_at_fire numeric not null,
  target numeric,
  message text not null
);

alter table alert_log enable row level security;
create policy "alert log is readable and writable" on alert_log
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on alert_log to authenticated;
grant select, insert, update, delete on alert_log to service_role;

-- Web Push subscriptions - one row per browser/device that's granted
-- notification permission. No user_id column since this is a 2-person joint
-- app with no per-user data scoping elsewhere.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "push subscriptions are readable and writable" on push_subscriptions
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on push_subscriptions to authenticated;
grant select, insert, update, delete on push_subscriptions to service_role;
