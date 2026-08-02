import { desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { subscriber } from '../db/schema';
import { syncSubscriberContact, unsubscribeContactFromTopic } from '../resend';

export async function listSubscribers(
	db: Db,
	{ limit, offset }: { limit: number; offset: number }
) {
	const [data, [{ count }]] = await Promise.all([
		db.query.subscriber.findMany({ limit, offset, orderBy: desc(subscriber.subscribedAt) }),
		db.select({ count: sql<number>`count(*)` }).from(subscriber)
	]);
	return { data, total: count };
}

// Mirrors auth.ts's databaseHooks.user.create.after (insert + Resend contact
// sync) but runs directly, with no Better Auth user/magic-link involved —
// same bypass already used by /setup and /invite/accept (see that hook's own
// comment). An API-added subscriber shouldn't have to click a magic link
// first.
export async function addSubscriber(db: Db, email: string) {
	await db.insert(subscriber).values({ email }).onConflictDoNothing();
	const row = (await db.query.subscriber.findFirst({ where: eq(subscriber.email, email) }))!;

	if (!row.resendContactId) {
		const pub = await db.query.publication.findFirst();
		const resendContactId = await syncSubscriberContact(
			pub?.resendApiKey ?? null,
			email,
			pub?.resendSegmentId ?? null,
			pub?.resendTopicId ?? null
		);
		if (resendContactId) {
			await db.update(subscriber).set({ resendContactId }).where(eq(subscriber.id, row.id));
			row.resendContactId = resendContactId;
		}
	}

	return row;
}

// Same honest-failure pattern as src/routes/unsubscribe/+page.server.ts — the
// real send list lives in Resend's Topic membership, so a failed API call
// means the reader keeps receiving emails no matter what our own DB says.
// Returns null if no subscriber with this id exists.
export async function unsubscribeSubscriberById(db: Db, id: string) {
	const row = await db.query.subscriber.findFirst({ where: eq(subscriber.id, id) });
	if (!row) return null;

	const pub = await db.query.publication.findFirst();
	if (!pub?.resendApiKey || !pub?.resendTopicId) {
		return { ok: false, unsubscribedAt: row.unsubscribedAt };
	}

	const ok = await unsubscribeContactFromTopic(pub.resendApiKey, row.email, pub.resendTopicId);
	if (!ok) return { ok: false, unsubscribedAt: row.unsubscribedAt };

	const unsubscribedAt = new Date();
	await db.update(subscriber).set({ unsubscribedAt }).where(eq(subscriber.id, id));
	return { ok: true, unsubscribedAt };
}
