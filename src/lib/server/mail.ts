async function sendEmail(env: Env, to: string, subject: string, html: string) {
	if (!env.RESEND_API_KEY) return;

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'Open Letter <editor@finsave.mrdshyml.xyz>',
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
	await sendEmail(
		env,
		to,
		'Your sign-in link',
		`<p>Click below to sign in:</p><p><a href="${url}">${url}</a></p>`
	);
}

export async function sendInvitationEmail(env: Env, to: string, url: string) {
	await sendEmail(
		env,
		to,
		"You've been invited as an admin",
		`<p>You've been invited to help manage this publication.</p><p><a href="${url}">Accept the invitation</a></p>`
	);
}
