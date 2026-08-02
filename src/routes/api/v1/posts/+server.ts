import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { requireApiKey } from '$lib/server/api/auth';
import { listPublishedPosts } from '$lib/server/api/posts';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export const GET: RequestHandler = async ({ request, platform, url }) => {
	const db = getDb(platform!.env.DB);
	const authError = await requireApiKey(request, db);
	if (authError) return authError;

	const limit = Math.min(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT);
	const offset = Number(url.searchParams.get('offset')) || 0;
	const { data, total } = await listPublishedPosts(db, { limit, offset });
	return json({ data, limit, offset, total });
};
