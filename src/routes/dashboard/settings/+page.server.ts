import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { invitation, publication } from '$lib/server/db/schema';
import { sendInvitationEmail } from '$lib/server/mail';
import { uploadLogo } from '$lib/server/media';
import { slugify } from '$lib/server/slug';

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const pub = await db.query.publication.findFirst();
	return { publication: pub };
};

export const actions: Actions = {
	save: async ({ request, platform }) => {
		const env = platform!.env;
		const db = getDb(env.DB);
		const data = await request.formData();

		const name = String(data.get('name') ?? '');
		const tagline = String(data.get('tagline') ?? '') || null;
		const description = String(data.get('description') ?? '') || null;
		const category = String(data.get('category') ?? '') || null;
		const logo = data.get('logo');

		const pub = await db.query.publication.findFirst();
		if (!pub) return { saved: false };

		let logoUrl = pub.logoUrl;
		if (logo instanceof File && logo.size > 0) {
			logoUrl = await uploadLogo(env, logo);
		}

		await db
			.update(publication)
			.set({ name, slug: slugify(name), tagline, description, category, logoUrl })
			.where(eq(publication.id, pub.id));

		return { saved: true };
	},
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
