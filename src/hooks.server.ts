import type { Handle } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const auth = createAuth(event.platform!.env, event.url.origin);
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;

	return resolve(event);
};
