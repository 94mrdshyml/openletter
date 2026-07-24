import { betterAuth } from 'better-auth';
import { eq } from 'drizzle-orm';
import { magicLink } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';
import * as schema from './db/schema';
import { generateId, type IdPrefix } from './id';
import { sendMagicLinkEmail } from './mail';
import { syncSubscriberContact } from './resend';

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
			})
		],
		databaseHooks: {
			user: {
				create: {
					// Every user created through the public magic-link path (never
					// through /setup or /invite/accept, which insert directly via
					// Drizzle and bypass this hook) is a reader by construction.
					after: async (user) => {
						await db.insert(schema.subscriber).values({ email: user.email }).onConflictDoNothing();

						const pub = await db.query.publication.findFirst();
						const resendContactId = await syncSubscriberContact(
							env,
							user.email,
							pub?.resendSegmentId ?? null,
							pub?.resendTopicId ?? null
						);
						if (resendContactId) {
							await db
								.update(schema.subscriber)
								.set({ resendContactId })
								.where(eq(schema.subscriber.email, user.email));
						}
					}
				}
			}
		}
	});
}
