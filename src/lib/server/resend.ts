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
// The API key and Segment id are writer-supplied (via /setup, then editable
// in dashboard/settings) and stored on the publication row — not env vars,
// not auto-created. A Resend account's Segments are capped by plan and
// shared account-wide across every project on it, not scoped per-app, so
// auto-creating one collided with that cap in practice. The Topic has no
// such cap, so it's still auto-created once, during /setup.

export async function createTopic(apiKey: string, name: string): Promise<string | null> {
	try {
		const topic = await resendFetch(apiKey, '/topics', 'POST', {
			name,
			default_subscription: 'opt_in'
		});
		return topic.id;
	} catch {
		console.error('Failed to create Resend topic');
		return null;
	}
}

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
