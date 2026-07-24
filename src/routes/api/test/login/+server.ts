// Test-only login bypass, used exclusively by the loginAsTestWriter e2e
// helper. Inert unless ENABLE_TEST_AUTH=true, which is only ever set in
// .dev.vars/CI — never in production secrets.
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createTestAuth } from '$lib/server/auth-test';
import { getDb } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform!.env;
	if (env.ENABLE_TEST_AUTH !== 'true') {
		return new Response('Not found', { status: 404 });
	}

	const email = url.searchParams.get('email') ?? env.WRITER_EMAIL;
	const auth = createTestAuth(env, url.origin);
	const ctx = await auth.$context;
	const test = ctx.test;

	const db = getDb(env.DB);
	const existing = await db.query.user.findFirst({ where: eq(userTable.email, email) });

	const userId = existing ? existing.id : (await test.saveUser(test.createUser({ email }))).id;

	const cookies = await test.getCookies({ userId, domain: url.hostname });
	return json({ cookies });
};
