import { redirect, type Handle } from '@sveltejs/kit';
import { createAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform!.env;

	// Ghost-style: the whole site redirects to /setup until the founding
	// admin exists. /setup itself and the Better Auth catch-all (needed for
	// the magic-link click that finishes setup) are excluded.
	if (event.url.pathname !== '/setup' && !event.url.pathname.startsWith('/api/')) {
		const db = getDb(env.DB);
		const lock = await db.query.setupLock.findFirst();
		if (!lock) redirect(303, '/setup');
	}

	const auth = createAuth(env, event.url.origin);
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.session = session?.session ?? null;
	event.locals.user = session?.user ?? null;

	return resolve(event);
};
