import { getDb } from './db';

// Inline-styled, table-based layout — email clients don't load stylesheets
// or support modern CSS, so every rule lives on the element itself and
// layout uses <table> rather than flex/grid.
function renderEmailHtml(
	pubName: string,
	logoUrl: string | null,
	heading: string,
	body: string,
	ctaText: string,
	ctaUrl: string
) {
	const brandMark = logoUrl
		? `<table role="presentation" cellpadding="0" cellspacing="0">
				<tr>
					<td style="padding-right:10px">
						<img
							src="${logoUrl}"
							alt=""
							width="28"
							height="28"
							style="display:block;width:28px;height:28px;object-fit:cover"
						/>
					</td>
					<td style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#ec3013;font-weight:800">
						${pubName}
					</td>
				</tr>
			</table>`
		: `<span style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#ec3013;font-weight:800"
				>${pubName}</span
			>`;

	return `<!doctype html>
<html>
	<body style="margin:0;padding:0;background:#f3f2f2;font-family:Archivo,Helvetica,Arial,sans-serif;color:#201e1d">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2f2">
			<tr>
				<td align="center" style="padding:56px 24px">
					<table
						role="presentation"
						width="560"
						cellpadding="0"
						cellspacing="0"
						style="max-width:560px;width:100%;background:#ffffff"
					>
						<tr>
							<td style="padding:36px 40px 24px;border-bottom:3px solid #ec3013">
								${brandMark}
							</td>
						</tr>
						<tr>
							<td style="padding:40px 40px 16px">
								<h1 style="margin:0;font-size:28px;line-height:1.3;letter-spacing:-0.02em;font-weight:800">
									${heading}
								</h1>
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px 36px">
								<p style="margin:0;font-size:16px;line-height:1.7;color:#444141">${body}</p>
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px 44px">
								<a
									href="${ctaUrl}"
									style="display:inline-block;background:#ec3013;color:#f3f2f2;font-weight:800;font-size:15px;text-decoration:none;padding:14px 32px"
									>${ctaText}</a
								>
							</td>
						</tr>
						<tr>
							<td style="padding:24px 40px 0;border-top:1px solid #d7d3d3">
								<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#605d5d">
									— The ${pubName} team
								</p>
								<p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:#9b9797">
									If you weren't expecting this email, you can safely ignore it.
								</p>
								<p style="margin:0;font-size:12px;line-height:1.5;color:#9b9797">
									If the button doesn't work, copy and paste this link:<br />
									<a href="${ctaUrl}" style="color:#9b9797">${ctaUrl}</a>
								</p>
							</td>
						</tr>
						<tr>
							<td style="height:40px"></td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;
}

async function sendEmail(
	env: Env,
	to: string,
	subject: string,
	buildContent: (pubName: string) => { heading: string; body: string; ctaText: string },
	ctaUrl: string
) {
	const db = getDb(env.DB);
	const pub = await db.query.publication.findFirst();
	if (!pub?.resendApiKey || !pub?.resendFromEmail) return;

	const { heading, body, ctaText } = buildContent(pub.name);
	const html = renderEmailHtml(pub.name, pub.logoUrl, heading, body, ctaText, ctaUrl);

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
			(pubName) => ({
				heading: `Sign in to ${pubName}`,
				body: 'Click below to access your dashboard.',
				ctaText: 'Sign in'
			}),
			url
		);
	} else {
		await sendEmail(
			env,
			to,
			'Confirm your subscription',
			(pubName) => ({
				heading: `Welcome to ${pubName}`,
				body: "Just one more step — confirm your email and you're in.",
				ctaText: 'Confirm subscription'
			}),
			url
		);
	}
}

export async function sendInvitationEmail(env: Env, to: string, url: string) {
	await sendEmail(
		env,
		to,
		"You've been invited as an admin",
		(pubName) => ({
			heading: `Join ${pubName} as an admin`,
			body: "You've been invited to help manage this publication.",
			ctaText: 'Accept invitation'
		}),
		url
	);
}
