-- Category alert config per the budget-alerting spec - adopts the spec's
-- target numbers (replacing the previously-set standing limits for the
-- categories listed below).

update categories set monthly_limit = 1100, alert_mode = 'threshold' where key = 'groceries';
update categories set monthly_limit = 402, alert_mode = 'threshold' where key = 'pets';
update categories set monthly_limit = 310, alert_mode = 'threshold' where key = 'shopping';
update categories set monthly_limit = 450, alert_mode = 'threshold' where key = 'dining_out';
update categories set monthly_limit = 350, alert_mode = 'threshold' where key = 'health_beauty';
update categories set monthly_limit = 180, alert_mode = 'threshold' where key = 'telecom';
update categories set monthly_limit = 500, alert_mode = 'threshold' where key = 'transfer';
-- Car Maintenance target is "under review" per the spec - still wired up as
-- a threshold alert with the spec's number, just flagged in the app copy.
update categories set monthly_limit = 120, alert_mode = 'threshold' where key = 'vehicle';

update categories set monthly_limit = 5453, alert_mode = 'fixed_expected' where key = 'mortgage_loans';
update categories set monthly_limit = 487, alert_mode = 'fixed_expected' where key = 'bills';
update categories set monthly_limit = 50, alert_mode = 'fixed_expected' where key = 'subscriptions';
update categories set monthly_limit = 78, alert_mode = 'fixed_expected' where key = 'tax_interest';

-- Trial categories: keep logging spend against the existing limit, but
-- suppress alerts until there's enough history to trust a threshold.
update categories set alert_mode = 'none', is_trial = true where key = 'fun';
update categories set alert_mode = 'none', is_trial = true where key = 'gifts_donations';

-- Uncategorised isn't a periodic budget - it's a running balance that should
-- never be allowed to build up past a small cap.
update categories set monthly_limit = 150, alert_mode = 'balance_cap' where key = 'uncategorized';

update categories set alert_mode = 'none' where key in ('income', 'internal_transfer');
