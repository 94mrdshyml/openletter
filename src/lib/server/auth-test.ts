// Test-only auth instance — adds Better Auth's official testUtils plugin so
// e2e tests can create a writer session without a real magic-link email
// round-trip. Kept separate from auth.ts per Better Auth's own guidance:
// conditionally spreading testUtils into the production config breaks
// `ctx.test` type inference, and it should never ship in the real config.
import { betterAuth } from 'better-auth';
import { magicLink, testUtils } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';
import * as schema from './db/schema';
import { generateId, type IdPrefix } from './id';
import { sendMagicLinkEmail } from './mail';

const modelPrefix: Record<string, IdPrefix> = {
	user: 'user',
	session: 'sess',
	account: 'acct',
	verification: 'ver'
};

export function createTestAuth(env: Env, baseURL: string) {
	const db = getDb(env.DB);

	return betterAuth({
		baseURL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'sqlite', schema }),
		advanced: {
			database: {
				generateId: (options: { model: string }) => generateId(modelPrefix[options.model] ?? 'user')
			}
		},
		user: {
			additionalFields: {
				role: { type: 'string', input: false, defaultValue: 'reader' },
				firstName: { type: 'string', required: false },
				lastName: { type: 'string', required: false }
			}
		},
		plugins: [
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await sendMagicLinkEmail(env, email, url);
				}
			}),
			testUtils()
		]
	});
}
