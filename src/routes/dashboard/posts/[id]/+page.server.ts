import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post, subscriber } from '$lib/server/db/schema';
import { parsePostForm } from '$lib/server/post-form';
import { sendPostPublishedBroadcast } from '$lib/server/mail';

// Every action authorizes itself rather than trusting the /dashboard gate in
// hooks.server.ts — see docs/SECURITY_AUDIT.md F-01. The gate covers this
// route too, but an action that depends on it is one refactor away from
// being wrong, and these two actions write posts to the public site.
function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		error(403, 'Forbidden');
	}
	return locals.user;
}

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = getDb(platform!.env.DB);
	const existing = await db.query.post.findFirst({ where: eq(post.id, params.id) });
	if (!existing) error(404, 'Post not found');

	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(subscriber);
	return { post: existing, subscriberCount: count };
};

export const actions: Actions = {
	save: async ({ request, platform, params, locals }) => {
		requireAdmin(locals);
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
	publish: async ({ request, platform, params, locals, url }) => {
		requireAdmin(locals);
		const env = platform!.env;
		const db = getDb(env.DB);
		const parsed = await parsePostForm(request, env);
		const existing = await db.query.post.findFirst({ where: eq(post.id, params.id) });
		const alreadyPublished = existing?.status === 'published';
		const isScheduled = !!parsed.scheduledAt && parsed.scheduledAt > new Date();
		const publishedAt = alreadyPublished
			? existing.publishedAt
			: isScheduled
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

		// Only a genuinely new publish (draft → published, happening now, not
		// scheduled) sends an email — re-saving an already-published post must
		// never re-notify subscribers just because the writer fixed a typo.
		if (!alreadyPublished && !isScheduled) {
			const sent = await sendPostPublishedBroadcast(env, url.origin, {
				title: parsed.title,
				subtitle: parsed.subtitle,
				body: parsed.body,
				coverImageUrl: parsed.coverImageUrl,
				slug: parsed.slug
			});
			if (sent) {
				await db
					.update(post)
					.set({ resendBroadcastId: sent.broadcastId, sentCount: sent.sentCount })
					.where(eq(post.id, params.id));
			}
		}

		return { published: true };
	}
};
