-- One rule per pattern, so manually categorising a transaction can upsert
-- (create-or-correct) its rule instead of accumulating duplicates.
alter table category_rules add constraint category_rules_pattern_key unique (pattern);
