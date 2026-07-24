import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
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

export function createAuth(env: Env, baseURL: string) {
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
		plugins: [
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await sendMagicLinkEmail(env, email, url);
				}
			})
		],
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						if (user.email === env.WRITER_EMAIL) return;
						await db.insert(schema.subscriber).values({ email: user.email }).onConflictDoNothing();
					}
				}
			}
		}
	});
}

// Shared by /login's form action and /login/check-email's resend action.
// Only ever sends for env.WRITER_EMAIL — every other email is a silent
// no-op, so the response is identical either way and reveals nothing.
export async function attemptWriterSignIn(
	auth: ReturnType<typeof createAuth>,
	env: Env,
	email: string,
	headers: Headers
) {
	if (email !== env.WRITER_EMAIL) return;
	await auth.api.signInMagicLink({
		body: { email, callbackURL: '/dashboard' },
		headers
	});
}
