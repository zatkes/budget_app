# Setup - Milestone 1 (schema + auth)

What exists so far: the database schema, row-level security, and a magic-link
sign-in flow protecting a placeholder app shell (tab bar + 6 screen stubs).
No bank data, no real screens yet - those are milestone 2 onward.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's provisioned, go to **Project Settings → API** and copy:
 - Project URL
 - `anon` `public` key
 - `service_role` key (keep this one secret - server-only)

## 2. Configure environment variables

```
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` from step 1. Leave `NEXT_PUBLIC_SITE_URL` as
`http://localhost:3000` for local dev.

## 3. Run the schema migration

No Docker/Supabase CLI required for this step - paste the SQL directly:

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the contents of `supabase/migrations/20260711000000_init.sql` and run it.
3. Paste the contents of `supabase/seed.sql` and run it (seeds the 6 budget
   categories and the assumed 7% market return setting).

(Once you're comfortable with the Supabase CLI, `npx supabase link` +
`npx supabase db push` does the same thing from the terminal and is the
better path once there are multiple migrations to track.)

## 4. Lock down auth

In the dashboard, **Authentication → Sign In / Providers → Email**:
- Turn **off** "Allow new users to sign up" - this app only ever has the 2
  seeded users below; there's no public registration screen.
- Confirm "Enable email OTP / magic link" is on (it is by default).

**Authentication → URL Configuration**:
- Add `http://localhost:3000/auth/callback` as a redirect URL.

## 5. Seed the 2 users

```
SIM_EMAIL=sim@example.com LUCIA_EMAIL=lucia@example.com npm run seed:users
```

Use whichever real email addresses you both want to sign in with - this
creates the 2 Supabase Auth users and their matching `profiles` row (this is
the only account-creation path; there's no sign-up form).

## 6. Run it

```
npm install
npm run dev
```

Visit `http://localhost:3000` → redirected to `/login` → enter one of the
seeded emails → open the emailed link → you should land on `/home` showing
your name and a small checklist confirming the profile and categories were
read back through RLS.

## Notes

- `owner_scope` (`joint` / `sim` / `lucia`) drives row-level security on
  `accounts`, `goals`, `mortgages`, and everything that hangs off an account
  (`transactions`, `holdings`, `balance_snapshots`) - a signed-in user only
  ever sees rows scoped to them or to `joint`.
- The PIN/Face ID "quick unlock" layer (WebAuthn + PIN fallback) sits on top
  of this Supabase session and is built in milestone 3, once there's an
  actual app to unlock into.
- Full architecture/rationale: `C:\Users\luciaz\.claude\plans\twinkly-humming-glacier.md`
  (or ask for it again - it's the approved plan this build follows).
