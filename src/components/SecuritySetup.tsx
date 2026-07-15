"use client";

import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { getRegistrationOptions, verifyRegistration, setPin } from "@/app/(app)/lock/actions";

const pillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--text)",
  padding: "7px 12px",
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

// Both entry points are deliberately plain window.prompt/confirm flows - no
// new modal system for a 2-person app. A PIN matters as much as Face ID
// here: it's the one fallback that works on any device, including one that
// never enrolled its own platform authenticator - without it, a device with
// no matching credential and no PIN would have no way to unlock at all.
export function SecuritySetup() {
  const router = useRouter();

  async function enableFaceId() {
    const label = window.prompt("Label this device (e.g. \"Lucia's iPhone\")", "") ?? "";
    try {
      const options = await getRegistrationOptions(label);
      const response = await startRegistration({ optionsJSON: options });
      const result = await verifyRegistration(response, label);
      if (result.success) {
        window.alert("Face ID / Touch ID enabled on this device.");
        router.refresh();
      } else {
        window.alert("Couldn't verify - try again.");
      }
    } catch {
      window.alert("Registration was cancelled or isn't supported on this device.");
    }
  }

  async function setupPin() {
    const pin = window.prompt("Set a 4-6 digit PIN (shared, works on any device):", "");
    if (!pin) return;
    const result = await setPin(pin);
    if (result.success) {
      window.alert("PIN set.");
      router.refresh();
    } else {
      window.alert(result.error ?? "Couldn't set PIN.");
    }
  }

  return (
    <>
      <button onClick={enableFaceId} style={pillStyle} aria-label="Enable Face ID or Touch ID">
        Enable Face ID
      </button>
      <button onClick={setupPin} style={pillStyle} aria-label="Set a PIN">
        Set PIN
      </button>
    </>
  );
}
