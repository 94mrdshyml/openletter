import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post, subscriber } from '$lib/server/db/schema';
import { parsePostForm } from '$lib/server/post-form';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = getDb(platform!.env.DB);
	const existing = await db.query.post.findFirst({ where: eq(post.id, params.id) });
	if (!existing) error(404, 'Post not found');

	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(subscriber);
	return { post: existing, subscriberCount: count };
};

export const actions: Actions = {
	save: async ({ request, platform, params }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const parsed = await parsePostForm(request, env);
		await db
			.update(post)
			.set({
				title: parsed.title,
				subtitle: parsed.subtitle,
				slug: parsed.slug,
				excerpt: parsed.excerpt,
				body: parsed.body,
				wall: parsed.wall,
				coverImageUrl: parsed.coverImageUrl,
				updatedAt: new Date()
			})
			.where(eq(post.id, params.id));
		return { saved: true };
	},
	publish: async ({ request, platform, params }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const parsed = await parsePostForm(request, env);
		const existing = await db.query.post.findFirst({ where: eq(post.id, params.id) });
		const alreadyPublished = existing?.status === 'published';
		const publishedAt = alreadyPublished
			? existing.publishedAt
			: parsed.scheduledAt && parsed.scheduledAt > new Date()
				? parsed.scheduledAt
				: new Date();

		await db
			.update(post)
			.set({
				title: parsed.title,
				subtitle: parsed.subtitle,
				slug: parsed.slug,
				excerpt: parsed.excerpt,
				body: parsed.body,
				wall: parsed.wall,
				coverImageUrl: parsed.coverImageUrl,
				status: 'published',
				publishedAt,
				updatedAt: new Date()
			})
			.where(eq(post.id, params.id));
		return { published: true };
	}
};
