import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { post, postEmailEvent } from '$lib/server/db/schema';
import { verifyResendWebhook } from '$lib/server/webhook';

type ResendWebhookEvent = {
	type: string;
	data: {
		broadcast_id?: string;
		to?: string[];
	};
};

// Public endpoint — the writer manually points a webhook at this URL from
// their Resend dashboard and pastes the signing secret into
// dashboard/settings. Every request must verify against that secret before
// its body is trusted at all; an unset secret means the writer hasn't wired
// this up yet, so every event is rejected rather than silently accepted.
export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform!.env;
	const db = getDb(env.DB);
	const pub = await db.query.publication.findFirst();
	if (!pub?.resendWebhookSecret) return json({ ok: false }, { status: 404 });

	const body = await request.text();
	const valid = await verifyResendWebhook(body, request.headers, pub.resendWebhookSecret);
	if (!valid) return json({ ok: false }, { status: 401 });

	let event: ResendWebhookEvent;
	try {
		event = JSON.parse(body);
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	if (event.type !== 'email.opened' && event.type !== 'email.clicked') {
		return json({ ok: true });
	}

	const broadcastId = event.data.broadcast_id;
	// Never log recipientEmail — reader email addresses are PII (see
	// CLAUDE.md's Security Rules).
	const recipientEmail = event.data.to?.[0];
	if (!broadcastId || !recipientEmail) return json({ ok: true });

	const targetPost = await db.query.post.findFirst({
		where: eq(post.resendBroadcastId, broadcastId)
	});
	if (!targetPost) return json({ ok: true });

	await db
		.insert(postEmailEvent)
		.values({
			postId: targetPost.id,
			type: event.type === 'email.opened' ? 'opened' : 'clicked',
			recipientEmail
		})
		.onConflictDoNothing();

	return json({ ok: true });
};
