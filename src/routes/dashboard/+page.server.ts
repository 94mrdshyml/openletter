import { desc, eq, isNull, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post, subscriber } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const [{ count: subscriberCount }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(subscriber)
		.where(isNull(subscriber.unsubscribedAt));
	const drafts = await db.query.post.findMany({
		where: eq(post.status, 'draft'),
		orderBy: desc(post.updatedAt)
	});
	const published = await db.query.post.findMany({
		where: eq(post.status, 'published'),
		orderBy: desc(post.publishedAt)
	});

	return { subscriberCount, drafts, published };
};
