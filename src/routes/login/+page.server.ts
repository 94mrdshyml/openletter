import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createAuth } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, platform, url }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');

		const auth = createAuth(platform!.env, url.origin);
		await auth.api.signInMagicLink({
			body: { email, callbackURL: '/dashboard' },
			headers: request.headers
		});

		redirect(303, `/login/check-email?email=${encodeURIComponent(email)}`);
	}
};
