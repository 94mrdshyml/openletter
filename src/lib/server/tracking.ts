// First-party email open/click tracking. Reuses sha256Hex/timingSafeEqual's
// sibling from src/lib/server/api/crypto.ts (webhook.ts keeps its own copy
// of timingSafeEqual too — not exported there, same reason).
import { timingSafeEqual } from './api/crypto';

const CLICK_MERGE_EMAIL = '{{{contact.email}}}';

function hexEncode(bytes: ArrayBuffer): string {
	return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Domain-separated from BETTER_AUTH_SECRET (prefixed, then hashed down to
// key material) rather than reusing the raw secret directly as the HMAC key
// — avoids cross-purpose secret reuse without requiring the writer to
// provision a brand-new `wrangler secret put` just for this.
async function hmacKey(secret: string): Promise<CryptoKey> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`track:${secret}`));
	return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function signClick(secret: string, postId: string, url: string): Promise<string> {
	const key = await hmacKey(secret);
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(`${postId}:${url}`)
	);
	return hexEncode(signature);
}

// No signature needed — this only ever inserts a row, never redirects, so
// there's no open-redirect surface to protect (unlike the click URL below).
export function buildOpenPixelUrl(origin: string, postId: string): string {
	return `${origin}/api/track/open?post=${encodeURIComponent(postId)}&email=${CLICK_MERGE_EMAIL}`;
}

export async function buildTrackedClickUrl(
	origin: string,
	secret: string,
	postId: string,
	url: string
): Promise<string> {
	const sig = await signClick(secret, postId, url);
	return `${origin}/api/track/click?post=${encodeURIComponent(postId)}&email=${CLICK_MERGE_EMAIL}&url=${encodeURIComponent(url)}&sig=${sig}`;
}

// The load-bearing security check for /api/track/click: without this, the
// route is an open redirect — anyone could hand-craft a `url=` pointing
// anywhere and the link would 302 through our own domain. A missing or
// tampered signature must always be rejected, never redirected to `url`.
export async function verifyClickSignature(
	secret: string,
	postId: string,
	url: string,
	sig: string
): Promise<boolean> {
	const expected = await signClick(secret, postId, url);
	return timingSafeEqual(expected, sig);
}

const HREF_RE = /<a\s+[^>]*href="([^"]*)"[^>]*>/gi;

// Rewrites every <a href> so a click routes through /api/track/click first.
// Async because buildUrl needs to sign each destination — same class of
// regex rewrite as mail.ts's applyHeadingFontToBody, just async.
export async function rewriteLinksForTracking(
	html: string,
	buildUrl: (url: string) => Promise<string>
): Promise<string> {
	const matches = [...html.matchAll(HREF_RE)];
	if (matches.length === 0) return html;

	let result = '';
	let lastIndex = 0;
	for (const match of matches) {
		const [fullMatch, href] = match;
		const trackedHref = await buildUrl(href);
		result += html.slice(lastIndex, match.index) + fullMatch.replace(href, trackedHref);
		lastIndex = match.index! + fullMatch.length;
	}
	return result + html.slice(lastIndex);
}

// Standard 1x1 transparent GIF, served by /api/track/open. Cache-Control:
// no-store is set by the route itself — must not be cached, or a second real
// open from the same client would never re-fetch it.
export const TRANSPARENT_PIXEL_GIF = Uint8Array.from(
	atob('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
	(c) => c.charCodeAt(0)
);
export const TRACKING_PIXEL_CONTENT_TYPE = 'image/gif';
