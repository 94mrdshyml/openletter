// Web Crypto only (crypto.subtle) — Workers-safe, same approach as
// src/lib/server/webhook.ts's Svix verification.

export async function sha256Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time-ish comparison — avoids a naive `===` that could short-circuit
// on the first differing byte and leak timing information about a hash we
// derived ourselves. Mirrors webhook.ts's own helper (not exported there).
export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return result === 0;
}
