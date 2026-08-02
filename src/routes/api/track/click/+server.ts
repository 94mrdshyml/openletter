import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { postEmailEvent } from '$lib/server/db/schema';
import { verifyClickSignature } from '$lib/server/tracking';

// First-party click-tracking redirect — every outbound link in a post
// broadcast is rewritten to point here first (see rewriteLinksForTracking in
// $lib/server/tracking). Public, no auth: hit directly by email clients.
//
// `sig` is the load-bearing security check. Without verifying it, this route
// is an open redirect — anyone could hand-craft a `url=` pointing anywhere
// and the link would 302 through our own domain. A missing/invalid signature
// must never redirect to `url`.
export const GET: RequestHandler = async ({ url, platform }) => {
	const postId = url.searchParams.get('post');
	// Never log this — reader email addresses are PII (CLAUDE.md Security Rules).
	const recipientEmail = url.searchParams.get('email');
	const destination = url.searchParams.get('url');
	const sig = url.searchParams.get('sig');

	if (!postId || !destination || !sig) {
		redirect(302, '/');
	}

	const valid = await verifyClickSignature(
		platform!.env.BETTER_AUTH_SECRET,
		postId,
		destination,
		sig
	);
	if (!valid) {
		redirect(302, '/');
	}

	if (recipientEmail) {
		try {
			const db = getDb(platform!.env.DB);
			await db
				.insert(postEmailEvent)
				.values({ postId, type: 'clicked', recipientEmail })
				.onConflictDoNothing();
		} catch {
			// Never let a tracking failure block the actual link the reader
			// clicked — same fail-open posture as the open pixel route.
		}
	}

	redirect(302, destination);
};
