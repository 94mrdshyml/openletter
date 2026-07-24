import type { RequestHandler } from './$types';
import { createAuth } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform, url }) => {
	const auth = createAuth(platform!.env, url.origin);

	// Route through the real /api/auth/sign-out endpoint (not a manually
	// relayed JS API call) so its Set-Cookie header, which actually clears
	// the session cookie, is produced correctly - then forward it onto our
	// own redirect response.
	const signOutRequest = new Request(new URL('/api/auth/sign-out', url.origin), {
		method: 'POST',
		headers: request.headers
	});
	const authResponse = await auth.handler(signOutRequest);

	const headers = new Headers(authResponse.headers);
	headers.set('Location', '/');
	return new Response(null, { status: 303, headers });
};
