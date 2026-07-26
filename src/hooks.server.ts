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

	// The /dashboard gate lives here, not in dashboard/+layout.server.ts, because
	// SvelteKit runs form actions BEFORE any load function (see
	// handle_action_request in kit's runtime/server/page/index.js). A guard in a
	// layout load therefore protects page renders but not actions — the action
	// commits its writes and only then does the redirect fire. Hooks run first,
	// so this covers both. Actions still re-check themselves; see requireAdmin.
	if (event.url.pathname.startsWith('/dashboard')) {
		if (!event.locals.user || event.locals.user.role !== 'admin') {
			redirect(303, '/login');
		}
	}

	return resolve(event);
};
