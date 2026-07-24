import type { RequestHandler } from './$types';
import { createAuth } from '$lib/server/auth';

const handle: RequestHandler = ({ request, platform, url }) => {
	const auth = createAuth(platform!.env, url.origin);
	return auth.handler(request);
};

export const GET = handle;
export const POST = handle;
