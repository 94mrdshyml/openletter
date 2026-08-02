import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { requireApiKey } from '$lib/server/api/auth';
import { getPublishedPostBySlug } from '$lib/server/api/posts';

export const GET: RequestHandler = async ({ request, platform, params }) => {
	const db = getDb(platform!.env.DB);
	const authError = await requireApiKey(request, db);
	if (authError) return authError;

	const found = await getPublishedPostBySlug(db, params.slug);
	if (!found) error(404, 'Post not found');
	return json(found);
};
