-- Moving from emoji to a curated icon set (Lucide icon names) across goals
-- and recurring bills, matching categories' icon-chip treatment.
alter table goals add column if not exists icon text not null default 'Target';
alter table goals drop column if exists emoji;

alter table recurring_bills add column if not exists icon text not null default 'Calendar';
alter table recurring_bills drop column if exists emoji;
