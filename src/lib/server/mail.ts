export async function sendMagicLinkEmail(env: Env, to: string, url: string) {
	if (!env.RESEND_API_KEY) return;

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'OpenLetter <onboarding@resend.dev>',
				to,
				subject: 'Your sign-in link',
				html: `<p>Click below to sign in:</p><p><a href="${url}">${url}</a></p>`
			})
		});
		if (!res.ok) throw new Error(`Resend responded ${res.status}`);
	} catch {
		console.error('Failed to send magic-link email');
	}
}
