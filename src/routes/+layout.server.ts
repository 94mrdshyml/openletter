import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { pickOnAccentColor } from '$lib/color';

export const load: LayoutServerLoad = async ({ platform, locals }) => {
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
			accentColor: true,
			headingFont: true,
			bodyFont: true,
			createdAt: true
		}
	});
	// Computed once per request from the publication's own accentColor —
	// see lib/color.ts for why this can't just always be light text.
	const onAccentColor = publication ? pickOnAccentColor(publication.accentColor).color : undefined;
	// Also flows to every page — just the display-safe subset of the signed-in
	// user, for nav gating (My profile / Dashboard / Log in).
	const user = locals.user
		? {
				firstName: locals.user.firstName,
				lastName: locals.user.lastName,
				name: locals.user.name,
				image: locals.user.image,
				role: locals.user.role
			}
		: null;
	return { publication, user, onAccentColor };
};
