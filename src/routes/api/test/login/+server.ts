// Test-only login bypass, used exclusively by the loginAsTestWriter e2e
// helper. Gated twice, and both gates must be open:
//
//   1. VITE_ENABLE_TEST_AUTH — a BUILD-time flag. Vite statically replaces
//      `import.meta.env.*`, so a build without it compiles this to `false`
//      and the handler body becomes unreachable. Note we can't gate on
//      $app/environment's `dev` here: playwright runs `bun run build && bun
//      run preview`, so e2e tests hit a production build where `dev` is false.
//   2. ENABLE_TEST_AUTH — a runtime binding, set only in .dev.vars/CI.
//
// The production deploy job sets neither. Never set either in production.
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTestAuth } from '$lib/server/auth-test';
import { getDb } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';

const BUILT_WITH_TEST_AUTH = import.meta.env.VITE_ENABLE_TEST_AUTH === 'true';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform!.env;
	if (!BUILT_WITH_TEST_AUTH || env.ENABLE_TEST_AUTH !== 'true') {
		return new Response('Not found', { status: 404 });
	}

	const email = url.searchParams.get('email') ?? 'test-writer@example.com';
	// Fail safe: an omitted or unrecognised role yields the least privilege,
	// not the most. Callers that want admin must ask for it explicitly.
	const role = url.searchParams.get('role') === 'admin' ? 'admin' : 'reader';
	const auth = createTestAuth(env, url.origin);
	const ctx = await auth.$context;
	const test = ctx.test;

	const db = getDb(env.DB);
	const existing = await db.query.user.findFirst({ where: eq(userTable.email, email) });

	let userId: string;
	if (existing) {
		if (existing.role !== role) {
			await db.update(userTable).set({ role }).where(eq(userTable.id, existing.id));
		}
		userId = existing.id;
	} else {
		userId = (await test.saveUser(test.createUser({ email, role }))).id;
	}

	const cookies = await test.getCookies({ userId, domain: url.hostname });
	return json({ cookies });
};
