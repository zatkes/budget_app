// One-off setup script: creates the app's exactly-2 auth users via the
// Supabase Admin API (plain SQL can't create auth.users rows correctly)
// and seeds their matching `profiles` row.
//
// Usage:
//   SIM_EMAIL=... LUCIA_EMAIL=... npm run seed:users
//
// Requires (in .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const simEmail = process.env.SIM_EMAIL;
const luciaEmail = process.env.LUCIA_EMAIL;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!simEmail || !luciaEmail) {
  console.error("Usage: SIM_EMAIL=you@example.com LUCIA_EMAIL=partner@example.com npm run seed:users");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const people = [
  { email: simEmail, displayName: "Sim", avatarInitials: "S", scope: "sim" },
  { email: luciaEmail, displayName: "Lucia", avatarInitials: "L", scope: "lucia" },
];

for (const person of people) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: person.email,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message?.toLowerCase().includes("already been registered")) {
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find((u) => u.email === person.email);
      if (!existing) throw new Error(`${person.email} reportedly exists but wasn't found`);
      userId = existing.id;
      console.log(`${person.email} already exists - reusing user ${userId}`);
    } else {
      throw createError;
    }
  } else {
    console.log(`Created auth user for ${person.email} (${userId})`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: person.email,
      display_name: person.displayName,
      avatar_initials: person.avatarInitials,
      scope: person.scope,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;
  console.log(`Upserted profile for ${person.displayName}`);
}

console.log("Done. Both users can now sign in via the magic-link form at /login.");
