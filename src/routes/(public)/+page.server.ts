import { and, desc, eq, lte } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { createAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { post, subscriber } from '$lib/server/db/schema';

// No 'scheduled' status or background job — see CLAUDE.md's Known Gotchas.
// A scheduled post is status:'published' with a future publishedAt; this
// filter is what actually keeps it invisible until that moment arrives.
export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const posts = await db.query.post.findMany({
		where: and(eq(post.status, 'published'), lte(post.publishedAt, new Date())),
		orderBy: desc(post.publishedAt)
	});
	return { posts };
};

export const actions: Actions = {
	subscribe: async ({ request, platform, url }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');

		const db = getDb(platform!.env.DB);
		const existing = await db.query.subscriber.findFirst({ where: eq(subscriber.email, email) });
		if (existing) {
			return { alreadySubscribed: true };
		}

		const auth = createAuth(platform!.env, url.origin);
		await auth.api.signInMagicLink({
			body: { email, callbackURL: '/' },
			headers: request.headers
		});

		return { subscribed: true };
	}
};
