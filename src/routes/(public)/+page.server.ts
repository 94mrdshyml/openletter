import type { Actions } from './$types';
import { createAuth } from '$lib/server/auth';

export const actions: Actions = {
	subscribe: async ({ request, platform, url }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');

		const auth = createAuth(platform!.env, url.origin);
		await auth.api.signInMagicLink({
			body: { email, callbackURL: '/' },
			headers: request.headers
		});

		return { subscribed: true };
	}
};
