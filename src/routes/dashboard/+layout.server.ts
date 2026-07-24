import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	if (!locals.user || locals.user.email !== platform!.env.WRITER_EMAIL) {
		redirect(303, '/login');
	}
};
