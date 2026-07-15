-- Device-level quick unlock (Face ID / Touch ID / Windows Hello via WebAuthn,
-- with a numeric PIN fallback for devices without a platform authenticator)
-- sitting on top of the real Supabase Auth session - this never replaces
-- the underlying login, it just gates the UI locally per device.

create table webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  device_label text,
  created_at timestamptz not null default now()
);

alter table webauthn_credentials enable row level security;
create policy "webauthn credentials are readable and writable" on webauthn_credentials
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on webauthn_credentials to authenticated;
grant select, insert, update, delete on webauthn_credentials to service_role;

-- Single shared household PIN (this is a 2-person joint app with no
-- per-user data scoping elsewhere) - hashed, never stored plaintext.
create table device_pin (
  id uuid primary key default gen_random_uuid(),
  pin_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table device_pin enable row level security;
create policy "device pin is readable and writable" on device_pin
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on device_pin to authenticated;
grant select, insert, update, delete on device_pin to service_role;
