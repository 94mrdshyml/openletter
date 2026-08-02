import { json } from '@sveltejs/kit';
import { eq, isNull } from 'drizzle-orm';
import type { Db } from '../db';
import { apiKey } from '../db/schema';
import { sha256Hex, timingSafeEqual } from './crypto';

// Every route handler starts with:
//   const authError = await requireApiKey(request, db);
//   if (authError) return authError;
// Multiple keys can be active at once (one per integration) — this checks
// the presented token against every non-revoked key's hash, not a single
// instance-wide secret.
export async function requireApiKey(request: Request, db: Db): Promise<Response | null> {
	const header = request.headers.get('authorization') ?? '';
	const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
	if (!token) return json({ error: 'Missing API key' }, { status: 401 });

	const hash = await sha256Hex(token);
	const active = await db.query.apiKey.findMany({ where: isNull(apiKey.revokedAt) });
	const matched = active.find((row) => timingSafeEqual(row.hash, hash));
	if (!matched) return json({ error: 'Invalid API key' }, { status: 401 });

	await db.update(apiKey).set({ lastUsedAt: new Date() }).where(eq(apiKey.id, matched.id));
	return null;
}
