import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	return { readerEmail: locals.user?.email ?? null };
};
