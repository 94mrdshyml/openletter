import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params, platform, locals, url }) => {
	const db = getDb(platform!.env.DB);
	const found = await db.query.post.findFirst({ where: eq(post.slug, params.slug) });
	if (!found) error(404, 'Post not found');

	const isVisible =
		found.status === 'published' && !!found.publishedAt && found.publishedAt <= new Date();
	const isAdminPreview = locals.user?.role === 'admin';
	if (!isVisible && !isAdminPreview) error(404, 'Post not found');

	// Subscribe-wall (free gate, not a paywall — see CLAUDE.md's Known
	// Gotchas). Anyone without a session — reader or admin — gets the
	// excerpt and a subscribe CTA instead of the full body.
	const gated = found.wall === 'subscribers' && !locals.user;

	return {
		post: { ...found, body: gated ? null : found.body },
		gated,
		isPreview: !isVisible && isAdminPreview,
		canonicalUrl: url.href
	};
};
