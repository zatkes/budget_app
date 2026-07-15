-- Marks the cycle sinking-fund tracking actually started in, so reserves
-- don't retroactively "bank" cycles before any standing limit existed (e.g.
-- transaction history Akahu pulled in from before budgeting began here).
-- Reserves only accumulate from the first cycle that closes on or after this
-- (mirrors the app's cycleStart() helper: 18th-of-month anchor).
with cycle as (
  select case
    when extract(day from current_date) < 18
      then (date_trunc('month', current_date) - interval '1 month' + interval '17 days')::date
    else (date_trunc('month', current_date) + interval '17 days')::date
  end as cycle_start
)
insert into app_settings (key, value)
select 'sinking_fund_start_period', to_jsonb(to_char(cycle_start, 'YYYY-MM-DD'))
from cycle
on conflict (key) do nothing;
