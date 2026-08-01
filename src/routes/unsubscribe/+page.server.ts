import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { subscriber } from '$lib/server/db/schema';
import { unsubscribeContactFromTopic } from '$lib/server/resend';

export const load: PageServerLoad = async ({ url }) => {
	return { email: url.searchParams.get('email') };
};

export const actions: Actions = {
	// Reads `email` from the query string, not a hidden form field — the link
	// in the newsletter footer is `/unsubscribe?email={{{contact.email}}}`
	// (a Resend merge tag, interpolated per-recipient at send time), and the
	// confirm form on this page just POSTs back to that same URL.
	default: async ({ platform, url }) => {
		const email = url.searchParams.get('email');
		if (!email) return { success: false };

		const env = platform!.env;
		const db = getDb(env.DB);
		const pub = await db.query.publication.findFirst();
		if (!pub?.resendApiKey || !pub?.resendTopicId) return { success: false };

		const ok = await unsubscribeContactFromTopic(pub.resendApiKey, email, pub.resendTopicId);
		if (ok) {
			await db
				.update(subscriber)
				.set({ unsubscribedAt: new Date() })
				.where(eq(subscriber.email, email));
		}
		// Honest about failure (not the anti-enumeration "always say success"
		// pattern some apps use) — the real send list lives in Resend, so a
		// failed API call here means the reader will keep receiving emails
		// no matter what our own DB says. Silently claiming success would be
		// actively misleading, not just imprecise.
		return { success: ok, contactEmail: pub.resendFromEmail };
	}
};
