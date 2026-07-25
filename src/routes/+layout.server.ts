import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	// This flows to every page's client-side hydration payload, including
	// public unauthenticated ones — explicitly select only display columns,
	// never resendApiKey or the rest of the Resend config.
	const publication = await db.query.publication.findFirst({
		columns: {
			id: true,
			name: true,
			slug: true,
			tagline: true,
			description: true,
			category: true,
			logoUrl: true,
			createdAt: true
		}
	});
	return { publication };
};
