import "server-only";

export type AkahuAccount = {
  _id: string;
  name: string;
  type: string;
  balance?: { current: number; available?: number; currency?: string };
};

export type AkahuTransaction = {
  _id: string;
  _account: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  merchant?: { name?: string };
};

function baseUrl() {
  return process.env.AKAHU_BASE_URL ?? "https://api.akahu.io/v1";
}

function authHeaders(): HeadersInit {
  const appToken = process.env.AKAHU_APP_TOKEN;
  const userToken = process.env.AKAHU_USER_TOKEN;
  if (!appToken || !userToken) {
    throw new Error(
      "Akahu isn't configured - set AKAHU_APP_TOKEN and AKAHU_USER_TOKEN in .env.local (see my.akahu.nz → Developers).",
    );
  }
  return {
    Authorization: `Bearer ${userToken}`,
    "X-Akahu-Id": appToken,
  };
}

export async function fetchAkahuAccounts(): Promise<AkahuAccount[]> {
  const res = await fetch(`${baseUrl()}/accounts`, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Akahu accounts request failed: ${res.status} ${await res.text()}`);
  }
  const body = await res.json();
  return body.items ?? [];
}

// Fetches every settled transaction since `startISO` (all accounts), paging
// through Akahu's cursor until exhausted. Akahu caps each page at 100 items.
export async function fetchAkahuTransactions(startISO?: string): Promise<AkahuTransaction[]> {
  const all: AkahuTransaction[] = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams();
    if (startISO) params.set("start", startISO);
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`${baseUrl()}/transactions?${params.toString()}`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Akahu transactions request failed: ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    all.push(...(body.items ?? []));
    cursor = body.cursor?.next ?? null;
  } while (cursor);

  return all;
}
