import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { createAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { subscriber } from '$lib/server/db/schema';

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
