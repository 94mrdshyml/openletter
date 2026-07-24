async function resendFetch(env: Env, path: string, method: string, body?: unknown) {
	const res = await fetch(`https://api.resend.com${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
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

export async function createSegment(env: Env, name: string): Promise<string | null> {
	if (!env.RESEND_API_KEY) return null;
	try {
		const segment = await resendFetch(env, '/segments', 'POST', { name });
		return segment.id;
	} catch {
		console.error('Failed to create Resend segment');
		return null;
	}
}

export async function createTopic(env: Env, name: string): Promise<string | null> {
	if (!env.RESEND_API_KEY) return null;
	try {
		const topic = await resendFetch(env, '/topics', 'POST', {
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
	env: Env,
	email: string,
	segmentId: string | null,
	topicId: string | null
): Promise<string | null> {
	if (!env.RESEND_API_KEY || !segmentId || !topicId) return null;
	try {
		const contact = await resendFetch(env, '/contacts', 'POST', {
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
