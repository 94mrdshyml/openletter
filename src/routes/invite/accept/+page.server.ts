import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { createAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { invitation, user as userTable } from '$lib/server/db/schema';
import { generateId } from '$lib/server/id';
import { uploadAvatar } from '$lib/server/media';

async function loadInvitation(db: ReturnType<typeof getDb>, token: string) {
	const invite = await db.query.invitation.findFirst({ where: eq(invitation.token, token) });
	if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
		error(404, 'This invitation is invalid or has expired.');
	}
	return invite;
}

export const load: PageServerLoad = async ({ url, platform }) => {
	const token = url.searchParams.get('token') ?? '';
	const db = getDb(platform!.env.DB);
	const invite = await loadInvitation(db, token);
	return { email: invite.email };
};

export const actions: Actions = {
	default: async ({ request, platform, url }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const token = url.searchParams.get('token') ?? '';
		const invite = await loadInvitation(db, token);

		const data = await request.formData();
		const firstName = String(data.get('firstName') ?? '');
		const lastName = String(data.get('lastName') ?? '');
		const picture = data.get('picture');

		let image: string | null = null;
		if (picture instanceof File && picture.size > 0) {
			image = await uploadAvatar(env, picture);
		}

		const existing = await db.query.user.findFirst({ where: eq(userTable.email, invite.email) });
		if (existing) {
			await db
				.update(userTable)
				.set({ role: 'admin', firstName, lastName, image, emailVerified: true })
				.where(eq(userTable.id, existing.id));
		} else {
			await db.insert(userTable).values({
				id: generateId('user'),
				name: `${firstName} ${lastName}`.trim() || invite.email,
				email: invite.email,
				emailVerified: true,
				role: 'admin',
				firstName,
				lastName,
				image
			});
		}

		await db
			.update(invitation)
			.set({ status: 'accepted', acceptedAt: new Date() })
			.where(eq(invitation.id, invite.id));

		const auth = createAuth(env, url.origin);
		await auth.api.signInMagicLink({
			body: { email: invite.email, callbackURL: '/dashboard' },
			headers: request.headers
		});

		redirect(303, `/login/check-email?email=${encodeURIComponent(invite.email)}`);
	}
};
