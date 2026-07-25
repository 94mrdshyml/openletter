import { redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post, subscriber } from '$lib/server/db/schema';
import { parsePostForm } from '$lib/server/post-form';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(subscriber);
	return { subscriberCount: count };
};

export const actions: Actions = {
	save: async ({ request, platform }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const parsed = await parsePostForm(request, env);
		const [created] = await db
			.insert(post)
			.values({
				title: parsed.title,
				subtitle: parsed.subtitle,
				slug: parsed.slug,
				excerpt: parsed.excerpt,
				body: parsed.body,
				wall: parsed.wall,
				coverImageUrl: parsed.coverImageUrl
			})
			.returning();
		redirect(303, `/dashboard/posts/${created.id}`);
	},
	publish: async ({ request, platform }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const parsed = await parsePostForm(request, env);
		const publishedAt =
			parsed.scheduledAt && parsed.scheduledAt > new Date() ? parsed.scheduledAt : new Date();
		const [created] = await db
			.insert(post)
			.values({
				title: parsed.title,
				subtitle: parsed.subtitle,
				slug: parsed.slug,
				excerpt: parsed.excerpt,
				body: parsed.body,
				wall: parsed.wall,
				coverImageUrl: parsed.coverImageUrl,
				status: 'published',
				publishedAt
			})
			.returning();
		redirect(303, `/dashboard/posts/${created.id}`);
	}
};
