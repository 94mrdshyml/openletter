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
	if (!pub) return { publication: pub };

	// resendApiKey is deliberately excluded — this data flows to the client
	// for hydration, and the settings form never needs to display the raw
	// key back (see +page.svelte's "leave blank to keep current" pattern).
	const { resendApiKey, ...publicationSafe } = pub;
	return { publication: { ...publicationSafe, hasResendApiKey: !!resendApiKey } };
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

		const resendApiKey = String(data.get('resendApiKey') ?? '') || null;
		const resendFromName = String(data.get('resendFromName') ?? '') || null;
		const resendFromEmail = String(data.get('resendFromEmail') ?? '') || null;
		const resendSegmentId = String(data.get('resendSegmentId') ?? '') || null;

		const pub = await db.query.publication.findFirst();
		if (!pub) return { saved: false };

		let logoUrl = pub.logoUrl;
		if (logo instanceof File && logo.size > 0) {
			logoUrl = await uploadLogo(env, logo);
		}

		await db
			.update(publication)
			.set({
				name,
				slug: slugify(name),
				tagline,
				description,
				category,
				logoUrl,
				// The API key field never round-trips to the client (see load),
				// so a blank submission means "unchanged," not "clear it" — the
				// other Resend fields DO round-trip pre-filled, so a blank
				// submission there is a deliberate clear, same as any other
				// field on this form.
				...(resendApiKey ? { resendApiKey } : {}),
				resendFromName,
				resendFromEmail,
				resendSegmentId
			})
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
