import { sha256Hex } from './crypto';

// Raw bearer token — deliberately not one of id.ts's {prefix}_{nanoid} row
// IDs. This is a secret, not a primary key: the api_key row's own id (a
// `key_` nanoid) identifies the row, this is the value a caller sends as
// `Authorization: Bearer <raw>`. Shown once, at creation time, in
// dashboard/settings — only its SHA-256 hash is ever persisted.
export async function generateApiKey(): Promise<{ raw: string; hash: string; lastFour: string }> {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
	const raw = `ol_${hex}`;
	const hash = await sha256Hex(raw);
	return { raw, hash, lastFour: hex.slice(-4) };
}
