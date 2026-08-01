// Manual Svix signature verification (Resend webhooks are Svix-signed).
// Implemented against Web Crypto rather than the `svix` npm package, whose
// Node-oriented internals aren't guaranteed to run on Workers — this is the
// documented algorithm (https://docs.svix.com/receiving/verifying-payloads/how-manual),
// about 20 lines with crypto.subtle.
const TOLERANCE_SECONDS = 5 * 60;

function base64Decode(b64: string): Uint8Array {
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function base64Encode(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes));
}

// Constant-time-ish comparison — avoids a naive `===` that could short-circuit
// on the first differing byte and leak timing information about a secret we
// derived ourselves.
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return result === 0;
}

export async function verifyResendWebhook(
	body: string,
	headers: Headers,
	secret: string
): Promise<boolean> {
	const svixId = headers.get('svix-id');
	const svixTimestamp = headers.get('svix-timestamp');
	const svixSignature = headers.get('svix-signature');
	if (!svixId || !svixTimestamp || !svixSignature) return false;

	const timestamp = Number(svixTimestamp);
	if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) {
		return false;
	}

	const secretBytes = base64Decode(secret.replace(/^whsec_/, ''));
	const key = await crypto.subtle.importKey(
		'raw',
		secretBytes as BufferSource,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signedContent = `${svixId}.${svixTimestamp}.${body}`;
	const signatureBytes = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(signedContent) as BufferSource
	);
	const expected = base64Encode(new Uint8Array(signatureBytes));

	return svixSignature
		.split(' ')
		.some((part) => timingSafeEqual(part.split(',')[1] ?? '', expected));
}
