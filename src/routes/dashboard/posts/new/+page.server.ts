import { error, redirect } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(subscriber);
	return { subscriberCount: count };
};

export const actions: Actions = {
	save: async ({ request, platform, locals }) => {
		requireAdmin(locals);
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
	publish: async ({ request, platform, locals, url }) => {
		requireAdmin(locals);
		const env = platform!.env;
		const db = getDb(env.DB);
		const parsed = await parsePostForm(request, env);
		const isScheduled = !!parsed.scheduledAt && parsed.scheduledAt > new Date();
		const publishedAt = isScheduled ? parsed.scheduledAt : new Date();
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

		// Scheduled posts don't send yet — there's no cron to fire the email
		// later when publishedAt arrives, same gap as their public visibility
		// (query-time filtered, not push-published). See docs/SESSION_LOG.md.
		if (!isScheduled) {
			const sent = await sendPostPublishedBroadcast(env, url.origin, created);
			if (sent) {
				await db
					.update(post)
					.set({ resendBroadcastId: sent.broadcastId, sentCount: sent.sentCount })
					.where(eq(post.id, created.id));
			}
		}

		redirect(303, `/dashboard/posts/${created.id}`);
	}
};
