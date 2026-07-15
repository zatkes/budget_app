"use server";

import { cookies } from "next/headers";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { generateUserID } from "@simplewebauthn/server/helpers";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { RP_NAME, getRpID, getOrigin } from "@/lib/webauthn/config";
import { hashPin, verifyPinHash } from "@/lib/webauthn/pin";

const CHALLENGE_COOKIE = "webauthn_challenge";
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 5;

async function setChallengeCookie(challenge: string) {
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
}

async function readAndClearChallengeCookie(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CHALLENGE_COOKIE)?.value ?? null;
  store.delete(CHALLENGE_COOKIE);
  return value;
}

export async function hasAnyCredential(): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("webauthn_credentials")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getRegistrationOptions(deviceLabel: string) {
  const supabase = await createClient();
  const { data: existing, error } = await supabase.from("webauthn_credentials").select("credential_id");
  if (error) throw error;

  const userID = await generateUserID();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpID(),
    userName: deviceLabel || "Sim & Lucia",
    userID,
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  await setChallengeCookie(options.challenge);
  return options;
}

export async function verifyRegistration(
  response: RegistrationResponseJSON,
  deviceLabel: string,
): Promise<{ success: boolean }> {
  const expectedChallenge = await readAndClearChallengeCookie();
  if (!expectedChallenge) return { success: false };

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpID(),
    });
  } catch {
    return { success: false };
  }

  if (!verification.verified || !verification.registrationInfo) return { success: false };

  const { credential } = verification.registrationInfo;
  const supabase = await createClient();
  const { error } = await supabase.from("webauthn_credentials").insert({
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    device_label: deviceLabel || null,
  });
  if (error) throw error;

  return { success: true };
}

export async function getAuthenticationOptions() {
  const supabase = await createClient();
  const { data: credentials, error } = await supabase.from("webauthn_credentials").select("credential_id");
  if (error) throw error;

  const options = await generateAuthenticationOptions({
    rpID: getRpID(),
    allowCredentials: (credentials ?? []).map((c) => ({ id: c.credential_id })),
    userVerification: "preferred",
  });

  await setChallengeCookie(options.challenge);
  return options;
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
): Promise<{ success: boolean }> {
  const expectedChallenge = await readAndClearChallengeCookie();
  if (!expectedChallenge) return { success: false };

  const supabase = await createClient();
  const { data: stored, error } = await supabase
    .from("webauthn_credentials")
    .select("id, credential_id, public_key, counter")
    .eq("credential_id", response.id)
    .maybeSingle();
  if (error) throw error;
  if (!stored) return { success: false };

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpID(),
      credential: {
        id: stored.credential_id,
        publicKey: isoBase64URL.toBuffer(stored.public_key),
        counter: stored.counter,
      },
    });
  } catch {
    return { success: false };
  }

  if (!verification.verified) return { success: false };

  await supabase
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("id", stored.id);

  return { success: true };
}

export async function hasPinSet(): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("device_pin").select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function setPin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (!/^\d{4,6}$/.test(pin)) {
    return { success: false, error: "PIN must be 4-6 digits." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("device_pin").select("id").maybeSingle();
  const pinHash = hashPin(pin);

  if (existing) {
    const { error } = await supabase
      .from("device_pin")
      .update({ pin_hash: pinHash, failed_attempts: 0, locked_until: null, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("device_pin").insert({ pin_hash: pinHash });
    if (error) throw error;
  }

  return { success: true };
}

export async function verifyPin(pin: string): Promise<{ success: boolean; lockedOut?: boolean }> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("device_pin")
    .select("id, pin_hash, failed_attempts, locked_until")
    .maybeSingle();
  if (error) throw error;
  if (!row) return { success: false };

  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    return { success: false, lockedOut: true };
  }

  const ok = verifyPinHash(pin, row.pin_hash);
  if (ok) {
    await supabase.from("device_pin").update({ failed_attempts: 0, locked_until: null }).eq("id", row.id);
    return { success: true };
  }

  const attempts = row.failed_attempts + 1;
  const lockedUntil =
    attempts >= MAX_PIN_ATTEMPTS ? new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000).toISOString() : null;
  await supabase
    .from("device_pin")
    .update({ failed_attempts: lockedUntil ? 0 : attempts, locked_until: lockedUntil })
    .eq("id", row.id);

  return { success: false, lockedOut: Boolean(lockedUntil) };
}
