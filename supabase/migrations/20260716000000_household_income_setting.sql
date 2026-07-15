-- Manual household income estimate, used as the "vs income" reference on the
-- cash flow chart until a real salary-receiving account is connected via Akahu.
insert into app_settings (key, value)
values ('household_income_per_cycle', '15600'::jsonb)
on conflict (key) do nothing;
