-- Sinking-fund categories: unspent budget rolls forward as a reserve buffer
-- instead of resetting to zero each cycle. Opt-in per category - fixed,
-- pre-committed costs (bills, telecom, subscriptions) don't need it since
-- they don't fluctuate the way groceries/shopping/Millie/etc. do.

alter table categories add column if not exists is_sinking_fund boolean not null default false;

update categories
set is_sinking_fund = true
where key in (
  'groceries', 'dining_out', 'vehicle', 'pets', 'fun',
  'shopping', 'health_beauty', 'gifts_donations', 'tax_interest', 'transfer'
);
