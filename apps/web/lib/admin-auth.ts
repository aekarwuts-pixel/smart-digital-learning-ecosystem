const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Aekarwut";

/**
 * Computes a SHA-256 hash of the ADMIN_PASSWORD environment variable.
 * Uses the Web Crypto API which is compatible with both Edge runtime and Node.js.
 */
export async function getAdminHash(): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ADMIN_PASSWORD);
  
  // globalThis.crypto is standard and available in Edge and Node.js 18+
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks if the provided cookie value matches the expected SHA-256 hash of the admin password.
 */
export async function verifyAdminOverride(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expectedHash = await getAdminHash();
  return cookieValue === expectedHash;
}
