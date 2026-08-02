import { sql } from 'drizzle-orm';
import { getDb } from './db';
import { subscriber } from './db/schema';
import { sendPostBroadcast } from './resend';
import { isValidHexColor, pickOnAccentColor } from '$lib/color';
import { isValidFont } from '$lib/fonts';

// Personalization values (accent color + heading/body fonts) as they land in
// every email template. Re-validated here — same defense-in-depth reasoning
// as +layout.svelte re-validating before turning stored values into live
// CSS/URLs — even though the settings action is the only writer.
interface Brand {
	accentColor: string;
	onAccentColor: string;
	headingFont: string;
	bodyFont: string;
}

function resolveBrand(pub: {
	accentColor: string;
	headingFont: string;
	bodyFont: string;
}): Brand {
	const accentColor = isValidHexColor(pub.accentColor) ? pub.accentColor : '#ec3013';
	const headingFont = isValidFont(pub.headingFont) ? pub.headingFont : 'Archivo';
	const bodyFont = isValidFont(pub.bodyFont) ? pub.bodyFont : 'Archivo';
	return { accentColor, onAccentColor: pickOnAccentColor(accentColor).color, headingFont, bodyFont };
}

// Google Fonts aren't loaded in an email context (most clients strip
// <link>/<style> imports), so email templates fall back to each font's own
// generic family after it in the stack — same fallback email clients would
// use anyway if the named font isn't installed on the recipient's device.
const EMAIL_FONT_FALLBACK = 'Helvetica,Arial,sans-serif';

// post.body is raw Tiptap-generated HTML with no inline styling of its own
// (see TiptapEditor.svelte — headings only get font-family via app.css's
// `h1..h6 { font-family: var(--font-heading) }` on the site, which doesn't
// exist in an email). Without this, every heading inside the post content
// silently inherits the surrounding <td>'s bodyFont instead. Tiptap only
// ever emits h2/h3 (StarterKit configured with `levels: [2, 3]`), but this
// matches h1-h6 generically rather than hardcoding those two levels.
export function applyHeadingFontToBody(html: string, headingFont: string): string {
	const styleDecl = `font-family:${headingFont},${EMAIL_FONT_FALLBACK}`;
	return html.replace(/<h([1-6])((?:\s+[^>]*)?)>/gi, (match, level, attrs) => {
		const styleMatch = attrs.match(/style\s*=\s*"([^"]*)"/i);
		if (styleMatch) {
			const merged = `${styleDecl};${styleMatch[1]}`;
			return `<h${level}${attrs.slice(0, styleMatch.index)}style="${merged}"${attrs.slice(styleMatch.index + styleMatch[0].length)}>`;
		}
		return `<h${level}${attrs} style="${styleDecl}">`;
	});
}

// Inline-styled, table-based layout — email clients don't load stylesheets
// or support modern CSS, so every rule lives on the element itself and
// layout uses <table> rather than flex/grid.
function renderEmailHtml(
	pubName: string,
	logoUrl: string | null,
	brand: Brand,
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
					<td style="font-family:${brand.headingFont},${EMAIL_FONT_FALLBACK};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${brand.accentColor};font-weight:800">
						${pubName}
					</td>
				</tr>
			</table>`
		: `<span style="font-family:${brand.headingFont},${EMAIL_FONT_FALLBACK};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${brand.accentColor};font-weight:800"
				>${pubName}</span
			>`;

	return `<!doctype html>
<html>
	<body style="margin:0;padding:0;background:#f3f2f2;font-family:${brand.bodyFont},${EMAIL_FONT_FALLBACK};color:#201e1d">
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
							<td style="padding:36px 40px 24px;border-bottom:3px solid ${brand.accentColor}">
								${brandMark}
							</td>
						</tr>
						<tr>
							<td style="padding:40px 40px 16px">
								<h1 style="margin:0;font-family:${brand.headingFont},${EMAIL_FONT_FALLBACK};font-size:28px;line-height:1.3;letter-spacing:-0.02em;font-weight:800">
									${heading}
								</h1>
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px 36px">
								<p style="margin:0;font-family:${brand.bodyFont},${EMAIL_FONT_FALLBACK};font-size:16px;line-height:1.7;color:#444141">${body}</p>
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px 44px">
								<a
									href="${ctaUrl}"
									style="display:inline-block;background:${brand.accentColor};color:${brand.onAccentColor};font-weight:800;font-size:15px;text-decoration:none;padding:14px 32px"
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

// The actual newsletter — full post content, not a teaser-and-link. Every
// recipient is already a subscriber (this only ever goes out to the
// publication's Segment), so there's no gating logic here the way the
// public post page has for anonymous visitors: everyone on the send list
// gets the full body regardless of the post's `wall` setting.
function renderPostEmailHtml(
	pubName: string,
	logoUrl: string | null,
	brand: Brand,
	post: { title: string; subtitle: string | null; body: string; coverImageUrl: string | null },
	postUrl: string,
	unsubscribeUrl: string
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
					<td style="font-family:${brand.headingFont},${EMAIL_FONT_FALLBACK};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${brand.accentColor};font-weight:800">
						${pubName}
					</td>
				</tr>
			</table>`
		: `<span style="font-family:${brand.headingFont},${EMAIL_FONT_FALLBACK};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${brand.accentColor};font-weight:800"
				>${pubName}</span
			>`;

	const coverImage = post.coverImageUrl
		? `<tr>
				<td style="padding:0 0 32px">
					<img
						src="${post.coverImageUrl}"
						alt=""
						width="600"
						style="display:block;width:100%;height:auto"
					/>
				</td>
			</tr>`
		: '';

	const subtitle = post.subtitle
		? `<p style="margin:0 0 28px;font-family:${brand.bodyFont},${EMAIL_FONT_FALLBACK};font-size:17px;line-height:1.6;color:#605d5d">${post.subtitle}</p>`
		: '';

	const body = applyHeadingFontToBody(post.body, brand.headingFont);

	return `<!doctype html>
<html>
	<body style="margin:0;padding:0;background:#f3f2f2;font-family:${brand.bodyFont},${EMAIL_FONT_FALLBACK};color:#201e1d">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f2f2">
			<tr>
				<td align="center" style="padding:56px 24px">
					<table
						role="presentation"
						width="600"
						cellpadding="0"
						cellspacing="0"
						style="max-width:600px;width:100%;background:#ffffff"
					>
						<tr>
							<td style="padding:36px 40px 24px;border-bottom:3px solid ${brand.accentColor}">
								${brandMark}
							</td>
						</tr>
						<tr>
							<td style="padding:40px 40px 0">
								<h1 style="margin:0 0 12px;font-family:${brand.headingFont},${EMAIL_FONT_FALLBACK};font-size:30px;line-height:1.2;letter-spacing:-0.02em;font-weight:800">
									${post.title}
								</h1>
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px">
								${subtitle}
							</td>
						</tr>
						${coverImage}
						<tr>
							<td
								style="padding:0 40px 40px;font-family:${brand.bodyFont},${EMAIL_FONT_FALLBACK};font-size:17px;line-height:1.7;color:#201e1d"
							>
								${body}
							</td>
						</tr>
						<tr>
							<td style="padding:0 40px 44px">
								<a
									href="${postUrl}"
									style="display:inline-block;background:${brand.accentColor};color:${brand.onAccentColor};font-weight:800;font-size:15px;text-decoration:none;padding:14px 32px"
									>Read online</a
								>
							</td>
						</tr>
						<tr>
							<td style="padding:24px 40px 0;border-top:1px solid #d7d3d3">
								<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#605d5d">
									— The ${pubName} team
								</p>
								<p style="margin:0;font-size:12px;line-height:1.5;color:#9b9797">
									<a href="${unsubscribeUrl}" style="color:#9b9797">Unsubscribe</a> from ${pubName}'s
									newsletter.
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
	const html = renderEmailHtml(pub.name, pub.logoUrl, resolveBrand(pub), heading, body, ctaText, ctaUrl);

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

// Called once per real (non-scheduled) publish — see the publish actions in
// dashboard/posts/new and dashboard/posts/[id]. Fails open like the rest of
// this file: a missing/broken Resend config means the post still publishes,
// it just doesn't get emailed (same resilience pattern as sendEmail above).
export async function sendPostPublishedBroadcast(
	env: Env,
	origin: string,
	post: {
		title: string;
		subtitle: string | null;
		body: string;
		coverImageUrl: string | null;
		slug: string;
	}
): Promise<{ broadcastId: string; sentCount: number } | null> {
	const db = getDb(env.DB);
	const pub = await db.query.publication.findFirst();
	if (!pub?.resendApiKey || !pub?.resendFromEmail || !pub?.resendSegmentId) return null;

	const [{ count: sentCount }] = await db.select({ count: sql<number>`count(*)` }).from(subscriber);
	if (sentCount === 0) return null;

	const postUrl = `${origin}/p/${post.slug}`;
	// {{{contact.email}}} is a Resend broadcast merge tag — interpolated to
	// the actual recipient's email per-send, not literal text. Must stay
	// unescaped/unencoded exactly as written for Resend to recognize it; see
	// src/routes/unsubscribe for what this link does.
	const unsubscribeUrl = `${origin}/unsubscribe?email={{{contact.email}}}`;
	const html = renderPostEmailHtml(pub.name, pub.logoUrl, resolveBrand(pub), post, postUrl, unsubscribeUrl);

	const broadcastId = await sendPostBroadcast(
		pub.resendApiKey,
		pub.resendSegmentId,
		pub.resendTopicId,
		`${pub.resendFromName || pub.name} <${pub.resendFromEmail}>`,
		post.title,
		html,
		post.title
	);
	if (!broadcastId) return null;

	return { broadcastId, sentCount };
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
