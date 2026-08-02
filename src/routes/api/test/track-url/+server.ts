// Test-only helper, used exclusively by e2e coverage of /api/track/click.
// Building a validly-signed tracking URL requires BETTER_AUTH_SECRET, which
// e2e tests have no legitimate way to know (it's a Worker secret, not
// writer-configurable like resendWebhookSecret) — this mirrors the same
// double-gated pattern as src/routes/api/test/login for the same class of
// problem. Never set either gate in production; see that file's own comment.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildTrackedClickUrl } from '$lib/server/tracking';

const BUILT_WITH_TEST_AUTH = import.meta.env.VITE_ENABLE_TEST_AUTH === 'true';

export const GET: RequestHandler = async ({ platform, url }) => {
	const env = platform!.env;
	if (!BUILT_WITH_TEST_AUTH || env.ENABLE_TEST_AUTH !== 'true') {
		return new Response('Not found', { status: 404 });
	}

	const postId = url.searchParams.get('post') ?? '';
	const destination = url.searchParams.get('url') ?? '';
	const trackedUrl = await buildTrackedClickUrl(
		url.origin,
		env.BETTER_AUTH_SECRET,
		postId,
		destination
	);
	return json({ trackedUrl });
};
