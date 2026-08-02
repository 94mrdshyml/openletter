import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { requireApiKey } from '$lib/server/api/auth';
import { unsubscribeSubscriberById } from '$lib/server/api/subscribers';

// The only supported operation — re-subscribing always goes through the real
// subscribe/Resend flow, never a direct DB flip.
export const PATCH: RequestHandler = async ({ request, platform, params }) => {
	const db = getDb(platform!.env.DB);
	const authError = await requireApiKey(request, db);
	if (authError) return authError;

	const body = (await request.json().catch(() => null)) as { unsubscribed?: unknown } | null;
	if (body?.unsubscribed !== true) {
		error(400, 'Only {"unsubscribed":true} is supported');
	}

	const result = await unsubscribeSubscriberById(db, params.id);
	if (!result) error(404, 'Subscriber not found');
	return json(result);
};
