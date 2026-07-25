import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadPostImage } from '$lib/server/media';

// Not covered by dashboard/+layout.server.ts's load-based gate — +server.ts
// routes don't inherit a sibling +layout's load function, only its own
// checks, so this needs its own auth guard.
export const POST: RequestHandler = async ({ request, platform, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		error(403, 'Forbidden');
	}

	const data = await request.formData();
	const file = data.get('image');
	if (!(file instanceof File) || file.size === 0) {
		error(400, 'No image provided');
	}

	const url = await uploadPostImage(platform!.env, file);
	return json({ url });
};
