import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { invitation } from '$lib/server/db/schema';
import { sendInvitationEmail } from '$lib/server/mail';

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const actions: Actions = {
	invite: async ({ request, platform, url, locals }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const data = await request.formData();
		const email = String(data.get('email') ?? '');

		const token = crypto.randomUUID();
		await db.insert(invitation).values({
			email,
			invitedByUserId: locals.user!.id,
			token,
			expiresAt: new Date(Date.now() + INVITATION_EXPIRY_MS)
		});

		const acceptUrl = `${url.origin}/invite/accept?token=${token}`;
		await sendInvitationEmail(env, email, acceptUrl);

		return { invited: true };
	}
};
