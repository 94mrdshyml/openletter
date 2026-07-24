import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { createAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { publication, setupLock, user as userTable } from '$lib/server/db/schema';
import { generateId } from '$lib/server/id';
import { uploadAvatar, uploadLogo } from '$lib/server/media';
import { slugify } from '$lib/server/slug';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const lock = await db.query.setupLock.findFirst();
	if (lock) redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ request, platform, url }) => {
		const env = platform!.env;
		const db = getDb(env.DB);

		// Atomic claim: setup_lock.id has a PRIMARY KEY constraint, so only one
		// concurrent request can ever win this insert, regardless of how many
		// hit /setup at once. This is what closes the race, not an email check.
		try {
			await db.insert(setupLock).values({ id: 1 });
		} catch {
			return fail(403, { message: 'Setup has already been completed.' });
		}

		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const firstName = String(data.get('firstName') ?? '');
		const lastName = String(data.get('lastName') ?? '');
		const picture = data.get('picture');

		const pubName = String(data.get('pubName') ?? '');
		const pubTagline = String(data.get('pubTagline') ?? '') || null;
		const pubCategory = String(data.get('pubCategory') ?? '') || null;
		const pubLogo = data.get('pubLogo');

		let image: string | null = null;
		if (picture instanceof File && picture.size > 0) {
			image = await uploadAvatar(env, picture);
		}

		let logoUrl: string | null = null;
		if (pubLogo instanceof File && pubLogo.size > 0) {
			logoUrl = await uploadLogo(env, pubLogo);
		}

		await db.insert(publication).values({
			name: pubName,
			slug: slugify(pubName),
			tagline: pubTagline,
			category: pubCategory,
			logoUrl
		});

		const existing = await db.query.user.findFirst({ where: eq(userTable.email, email) });
		if (existing) {
			await db
				.update(userTable)
				.set({ role: 'admin', firstName, lastName, image, emailVerified: true })
				.where(eq(userTable.id, existing.id));
		} else {
			await db.insert(userTable).values({
				id: generateId('user'),
				name: `${firstName} ${lastName}`.trim() || email,
				email,
				emailVerified: true,
				role: 'admin',
				firstName,
				lastName,
				image
			});
		}

		const auth = createAuth(env, url.origin);
		await auth.api.signInMagicLink({
			body: { email, callbackURL: '/dashboard' },
			headers: request.headers
		});

		redirect(303, `/login/check-email?email=${encodeURIComponent(email)}`);
	}
};
