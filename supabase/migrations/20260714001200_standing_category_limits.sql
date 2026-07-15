-- One standing budget limit per category instead of a limit-per-cycle you
-- had to re-set every time. Past cycles now compare their actual spend
-- against this same current limit, not a limit frozen at that point in time.

alter table categories add column if not exists monthly_limit numeric(14, 2);

-- Carry over whatever was most recently set per category, if anything.
update categories c
set monthly_limit = latest.limit_amount
from (
  select distinct on (category_id) category_id, limit_amount
  from budgets
  order by category_id, period_month desc
) as latest
where latest.category_id = c.id;

drop table if exists budgets;
