import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const drafts = await db.query.post.findMany({
		where: eq(post.status, 'draft'),
		orderBy: desc(post.updatedAt)
	});
	const published = await db.query.post.findMany({
		where: eq(post.status, 'published'),
		orderBy: desc(post.publishedAt)
	});

	return { drafts, published };
};
