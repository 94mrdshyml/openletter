import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { requireApiKey } from '$lib/server/api/auth';
import { addSubscriber, listSubscribers } from '$lib/server/api/subscribers';
import { isValidEmail } from '$lib/server/api/validate';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export const GET: RequestHandler = async ({ request, platform, url }) => {
	const db = getDb(platform!.env.DB);
	const authError = await requireApiKey(request, db);
	if (authError) return authError;

	const limit = Math.min(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT);
	const offset = Number(url.searchParams.get('offset')) || 0;
	const { data, total } = await listSubscribers(db, { limit, offset });
	return json({ data, limit, offset, total });
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = getDb(platform!.env.DB);
	const authError = await requireApiKey(request, db);
	if (authError) return authError;

	const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
	const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
	if (!isValidEmail(email)) error(400, 'Invalid email');

	const row = await addSubscriber(db, email);
	return json({ id: row.id, email: row.email, subscribedAt: row.subscribedAt }, { status: 201 });
};
