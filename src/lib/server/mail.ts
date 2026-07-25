import { getDb } from './db';

async function sendEmail(env: Env, to: string, subject: string, html: string) {
	const db = getDb(env.DB);
	const pub = await db.query.publication.findFirst();
	if (!pub?.resendApiKey || !pub?.resendFromEmail) return;

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${pub.resendApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: `${pub.resendFromName || pub.name} <${pub.resendFromEmail}>`,
				to,
				subject,
				html
			})
		});
		if (!res.ok) throw new Error(`Resend responded ${res.status}`);
	} catch {
		console.error('Failed to send email');
	}
}

export async function sendMagicLinkEmail(env: Env, to: string, url: string) {
	// Every magic-link request — admin dashboard login, admin bootstrap in
	// /setup, and reader subscribe — goes through this one callback. Better
	// Auth always embeds the request's callbackURL in the link (see
	// magic-link/index.mjs), so it doubles as a reliable signal for which
	// copy fits: only admin flows use /dashboard, so anything else is a
	// reader subscribing, not signing in.
	const callbackURL = new URL(url).searchParams.get('callbackURL');
	if (callbackURL === '/dashboard') {
		await sendEmail(
			env,
			to,
			'Your sign-in link',
			`<p>Click below to sign in:</p><p><a href="${url}">${url}</a></p>`
		);
	} else {
		await sendEmail(
			env,
			to,
			'Confirm your subscription',
			`<p>Click below to confirm your subscription and start receiving new posts by email:</p><p><a href="${url}">${url}</a></p>`
		);
	}
}

export async function sendInvitationEmail(env: Env, to: string, url: string) {
	await sendEmail(
		env,
		to,
		"You've been invited as an admin",
		`<p>You've been invited to help manage this publication.</p><p><a href="${url}">Accept the invitation</a></p>`
	);
}
