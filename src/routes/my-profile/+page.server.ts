import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { uploadAvatar } from '$lib/server/media';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	return { user: locals.user };
};

export const actions: Actions = {
	save: async ({ request, platform, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const env = platform!.env;
		const db = getDb(env.DB);
		const data = await request.formData();

		const firstName = String(data.get('firstName') ?? '') || null;
		const lastName = String(data.get('lastName') ?? '') || null;
		const avatar = data.get('avatar');

		let image = locals.user.image;
		if (avatar instanceof File && avatar.size > 0) {
			image = await uploadAvatar(env, avatar);
		}

		await db.update(user).set({ firstName, lastName, image }).where(eq(user.id, locals.user.id));

		return { saved: true };
	}
};
