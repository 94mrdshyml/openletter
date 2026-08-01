import { desc, eq, gte, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { post, postEmailEvent, subscriber } from '$lib/server/db/schema';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const GROWTH_WEEKS = 24;
const WEEK_ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);

	const [{ count: subscriberCount }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(subscriber);

	const weekAgo = new Date(Date.now() - 7 * WEEK_ONE_DAY_MS);
	const [{ count: newThisWeek }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(subscriber)
		.where(gte(subscriber.subscribedAt, weekAgo));

	const publishedPosts = await db.query.post.findMany({
		where: eq(post.status, 'published'),
		orderBy: desc(post.publishedAt)
	});

	// COUNT(*) against post_email_event, not counters on `post` — see that
	// table's own comment on why (dedup, never double-counts a re-delivery).
	const eventCounts = await db
		.select({
			postId: postEmailEvent.postId,
			type: postEmailEvent.type,
			count: sql<number>`count(*)`
		})
		.from(postEmailEvent)
		.groupBy(postEmailEvent.postId, postEmailEvent.type);

	const eventsByPost = new Map<string, { opened: number; clicked: number }>();
	for (const row of eventCounts) {
		const entry = eventsByPost.get(row.postId) ?? { opened: 0, clicked: 0 };
		entry[row.type] = row.count;
		eventsByPost.set(row.postId, entry);
	}

	// Only posts that actually sent a broadcast have a real denominator —
	// posts published before this session (or with a broken Resend config at
	// publish time) have sentCount: null and are excluded rather than shown
	// with a misleading 0%.
	const postPerformance = publishedPosts
		.filter((p): p is typeof p & { sentCount: number; publishedAt: Date } => !!p.sentCount)
		.map((p) => {
			const events = eventsByPost.get(p.id) ?? { opened: 0, clicked: 0 };
			return {
				title: p.title,
				publishedAt: p.publishedAt,
				sentCount: p.sentCount,
				opened: events.opened,
				openRate: Math.round((events.opened / p.sentCount) * 100),
				clicks: events.clicked
			};
		});

	const avgOpenRate = postPerformance.length
		? Math.round(postPerformance.reduce((sum, p) => sum + p.openRate, 0) / postPerformance.length)
		: 0;
	const avgClickRate = postPerformance.length
		? Math.round(
				postPerformance.reduce((sum, p) => sum + (p.clicks / p.sentCount) * 100, 0) /
					postPerformance.length
			)
		: 0;

	// Weekly cumulative subscriber count for the growth chart — computed in
	// JS from raw subscribedAt timestamps rather than a SQL date-bucketing
	// query. Self-hosted single-publication scale (dozens to low thousands
	// of subscribers), so this stays simple instead of leaning on
	// SQLite-specific date functions.
	const allSubscribers = await db.query.subscriber.findMany({ columns: { subscribedAt: true } });
	const windowStart = new Date(Date.now() - (GROWTH_WEEKS - 1) * WEEK_MS);
	let cumulative = allSubscribers.filter((s) => s.subscribedAt < windowStart).length;
	const subscriberGrowth: number[] = [];
	const growthWeekStarts: Date[] = [];
	for (let i = 0; i < GROWTH_WEEKS; i++) {
		const weekStart = new Date(windowStart.getTime() + i * WEEK_MS);
		const weekEnd = new Date(weekStart.getTime() + WEEK_MS);
		cumulative += allSubscribers.filter(
			(s) => s.subscribedAt >= weekStart && s.subscribedAt < weekEnd
		).length;
		subscriberGrowth.push(cumulative);
		growthWeekStarts.push(weekStart);
	}
	const monthLabels = [0, 4, 8, 12, 16, 20].map((i) =>
		growthWeekStarts[i].toLocaleDateString('en-US', { month: 'short' })
	);

	return {
		subscriberCount,
		newThisWeek,
		postsPublished: publishedPosts.length,
		avgOpenRate,
		avgClickRate,
		postPerformance,
		subscriberGrowth,
		monthLabels
	};
};
