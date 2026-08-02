import { and, desc, eq, lte, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { post } from '../db/schema';

// Full body always included, wall regardless — an API key represents the
// writer/instance itself, not an anonymous reader session, so the
// subscriber-wall gate ((public)/p/[slug]/+page.server.ts's `gated` check)
// doesn't apply here.
export async function listPublishedPosts(
	db: Db,
	{ limit, offset }: { limit: number; offset: number }
) {
	const where = and(eq(post.status, 'published'), lte(post.publishedAt, new Date()));
	const [data, [{ count }]] = await Promise.all([
		db.query.post.findMany({ where, limit, offset, orderBy: desc(post.publishedAt) }),
		db
			.select({ count: sql<number>`count(*)` })
			.from(post)
			.where(where)
	]);
	return { data, total: count };
}

export async function getPublishedPostBySlug(db: Db, slug: string) {
	const found = await db.query.post.findFirst({ where: eq(post.slug, slug) });
	if (!found) return null;
	const isVisible =
		found.status === 'published' && !!found.publishedAt && found.publishedAt <= new Date();
	return isVisible ? found : null;
}
