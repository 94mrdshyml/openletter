import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const publication = await db.query.publication.findFirst();
	return { publication };
};
