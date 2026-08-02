import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { postEmailEvent } from '$lib/server/db/schema';
import { TRACKING_PIXEL_CONTENT_TYPE, TRANSPARENT_PIXEL_GIF } from '$lib/server/tracking';

// First-party open-tracking pixel — embedded in every post broadcast (see
// buildOpenPixelUrl in $lib/server/tracking). Public, no auth: hit directly
// by anonymous email clients loading remote images. Always returns the pixel
// regardless of whether the event was recorded — never error back to an
// email client (same fail-open posture as the rest of the send path).
export const GET: RequestHandler = async ({ url, platform }) => {
	const postId = url.searchParams.get('post');
	// Never log this — reader email addresses are PII (CLAUDE.md Security Rules).
	const recipientEmail = url.searchParams.get('email');

	if (postId && recipientEmail) {
		try {
			const db = getDb(platform!.env.DB);
			await db
				.insert(postEmailEvent)
				.values({ postId, type: 'opened', recipientEmail })
				.onConflictDoNothing();
		} catch {
			// Never let a tracking failure (e.g. the post was since deleted,
			// breaking the FK) surface to the email client — the pixel must
			// always load.
		}
	}

	return new Response(TRANSPARENT_PIXEL_GIF, {
		headers: {
			'Content-Type': TRACKING_PIXEL_CONTENT_TYPE,
			'Cache-Control': 'no-store'
		}
	});
};
