import { desc, isNotNull, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post, postEmailEvent, subscriber } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const subscribers = await db.query.subscriber.findMany({
		orderBy: desc(subscriber.subscribedAt)
	});

	// Every subscriber sits on the same single Segment/Topic (PRD.md §10), so
	// "newsletters received" for a given subscriber is just: how many sent
	// posts were published while they were subscribed. Computed here rather
	// than tracked per-delivery — there's no per-recipient send record, only
	// the aggregate sentCount snapshot on each post.
	const sentPosts = await db.query.post.findMany({
		where: isNotNull(post.sentCount),
		columns: { publishedAt: true }
	});
	const sentDates = sentPosts.map((p) => p.publishedAt!);

	const eventCounts = await db
		.select({
			recipientEmail: postEmailEvent.recipientEmail,
			type: postEmailEvent.type,
			count: sql<number>`count(*)`
		})
		.from(postEmailEvent)
		.groupBy(postEmailEvent.recipientEmail, postEmailEvent.type);

	const eventsByEmail = new Map<string, { opened: number; clicked: number }>();
	for (const row of eventCounts) {
		const entry = eventsByEmail.get(row.recipientEmail) ?? { opened: 0, clicked: 0 };
		entry[row.type] = row.count;
		eventsByEmail.set(row.recipientEmail, entry);
	}

	const rows = subscribers.map((s) => {
		const windowEnd = s.unsubscribedAt ?? new Date();
		const received = sentDates.filter((d) => d >= s.subscribedAt && d <= windowEnd).length;
		const events = eventsByEmail.get(s.email) ?? { opened: 0, clicked: 0 };
		return {
			id: s.id,
			email: s.email,
			subscribedAt: s.subscribedAt,
			unsubscribedAt: s.unsubscribedAt,
			received,
			opened: events.opened,
			clicked: events.clicked
		};
	});

	return { subscribers: rows };
};
