async function resendFetch(apiKey: string, path: string, method: string, body?: unknown) {
	const res = await fetch(`https://api.resend.com${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: body ? JSON.stringify(body) : undefined
	});
	if (!res.ok) throw new Error(`Resend responded ${res.status}`);
	return res.json() as Promise<{ id: string }>;
}

// Segments (internal grouping for targeting sends) and Topics (reader-facing
// preference categories) are Resend's post-Audiences contact model — see
// CLAUDE.md's Known Gotchas. Never use the deprecated /audiences endpoint.
//
// The API key, Segment id, and Topic id are all writer-supplied (via
// /setup, then editable in dashboard/settings) and stored on the
// publication row — not env vars, not auto-created. Both a Segment and a
// Topic belong to whichever Resend account issued them, so an
// auto-provisioned one is only ever valid for the account whose key
// created it — the app has no reliable way to know when a stored key has
// moved to a different account, so it doesn't try to manage either
// resource's lifecycle at all. The writer creates both directly in the
// Resend dashboard and pastes the ids.

// Creates (or attaches) a subscriber as a Resend contact on the
// publication's single Segment + Topic. Fails open, same resilience
// pattern as mail.ts: a Resend outage must never block a reader's
// subscribe flow, so failures are swallowed and logged generically.
export async function syncSubscriberContact(
	apiKey: string | null,
	email: string,
	segmentId: string | null,
	topicId: string | null
): Promise<string | null> {
	if (!apiKey || !segmentId || !topicId) return null;
	try {
		const contact = await resendFetch(apiKey, '/contacts', 'POST', {
			email,
			segments: [{ id: segmentId }],
			topics: [{ id: topicId, subscription: 'opt_in' }]
		});
		return contact.id;
	} catch {
		console.error('Failed to sync Resend contact');
		return null;
	}
}

// Creates and immediately sends a Broadcast to the publication's Segment
// (scoped to its Topic, if set) — this is the actual "publish → email" send,
// called once per real publish from mail.ts's sendPostPublishedBroadcast.
// Resend's broadcast endpoints return no engagement stats (checked create/
// get/list) — open and click counts only exist as webhook events, recorded
// separately by src/routes/api/webhooks/resend.
export async function sendPostBroadcast(
	apiKey: string,
	segmentId: string,
	topicId: string | null,
	from: string,
	subject: string,
	html: string
): Promise<string | null> {
	try {
		const broadcast = await resendFetch(apiKey, '/broadcasts', 'POST', {
			segment_id: segmentId,
			...(topicId ? { topic_id: topicId } : {}),
			from,
			subject,
			html,
			send: true
		});
		return broadcast.id;
	} catch {
		console.error('Failed to send post broadcast');
		return null;
	}
}
