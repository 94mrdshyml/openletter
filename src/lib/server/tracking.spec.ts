import { describe, expect, it } from 'vitest';
import {
	buildOpenPixelUrl,
	buildTrackedClickUrl,
	rewriteLinksForTracking,
	verifyClickSignature
} from './tracking';

const SECRET = 'test-only-secret-value';
const ORIGIN = 'https://writer.example.com';
const POST_ID = 'post_abc123';

describe('buildOpenPixelUrl', () => {
	it('builds a pixel URL carrying the post id and the unescaped email merge tag', () => {
		// {{{contact.email}}} must reach Resend byte-for-byte unescaped (see
		// CLAUDE.md's Known Gotchas) — must NOT be URL-encoded here.
		const url = buildOpenPixelUrl(ORIGIN, POST_ID);
		expect(url).toBe(`${ORIGIN}/api/track/open?post=${POST_ID}&email={{{contact.email}}}`);
	});
});

describe('buildTrackedClickUrl / verifyClickSignature', () => {
	it('produces a URL whose signature verifies against the same inputs', async () => {
		const url = await buildTrackedClickUrl(ORIGIN, SECRET, POST_ID, 'https://example.com/article');
		const parsed = new URL(url);

		expect(parsed.searchParams.get('post')).toBe(POST_ID);
		expect(parsed.searchParams.get('url')).toBe('https://example.com/article');

		const sig = parsed.searchParams.get('sig')!;
		const valid = await verifyClickSignature(SECRET, POST_ID, 'https://example.com/article', sig);
		expect(valid).toBe(true);
	});

	it('rejects a tampered destination url', async () => {
		const url = await buildTrackedClickUrl(ORIGIN, SECRET, POST_ID, 'https://example.com/article');
		const sig = new URL(url).searchParams.get('sig')!;

		const valid = await verifyClickSignature(SECRET, POST_ID, 'https://evil.example.com', sig);
		expect(valid).toBe(false);
	});

	it('rejects a tampered post id', async () => {
		const url = await buildTrackedClickUrl(ORIGIN, SECRET, POST_ID, 'https://example.com/article');
		const sig = new URL(url).searchParams.get('sig')!;

		const valid = await verifyClickSignature(
			SECRET,
			'post_someoneElse',
			'https://example.com/article',
			sig
		);
		expect(valid).toBe(false);
	});

	it('rejects a bogus signature', async () => {
		const valid = await verifyClickSignature(
			SECRET,
			POST_ID,
			'https://example.com/article',
			'0000000000000000000000000000000000000000000000000000000000000000'
		);
		expect(valid).toBe(false);
	});

	it('produces a different signature under a different secret', async () => {
		const a = await buildTrackedClickUrl(ORIGIN, SECRET, POST_ID, 'https://example.com/article');
		const b = await buildTrackedClickUrl(
			ORIGIN,
			'a-different-secret',
			POST_ID,
			'https://example.com/article'
		);
		expect(new URL(a).searchParams.get('sig')).not.toBe(new URL(b).searchParams.get('sig'));
	});
});

describe('rewriteLinksForTracking', () => {
	it('rewrites every <a href> through the provided builder', async () => {
		const html =
			'<p>Read <a href="https://example.com/one">this</a> and <a href="https://example.com/two">that</a>.</p>';

		const rewritten = await rewriteLinksForTracking(
			html,
			async (url) => `https://tracked.example.com/?u=${url}`
		);

		expect(rewritten).toBe(
			'<p>Read <a href="https://tracked.example.com/?u=https://example.com/one">this</a> and ' +
				'<a href="https://tracked.example.com/?u=https://example.com/two">that</a>.</p>'
		);
	});

	it('leaves html with no anchors untouched', async () => {
		const html = '<p>No links here.</p>';
		const rewritten = await rewriteLinksForTracking(html, async (url) => `tracked:${url}`);
		expect(rewritten).toBe(html);
	});

	it('leaves other attributes on the anchor tag intact', async () => {
		const html = '<a class="cta" href="https://example.com" target="_blank">Go</a>';
		const rewritten = await rewriteLinksForTracking(
			html,
			async () => 'https://tracked.example.com'
		);
		expect(rewritten).toBe(
			'<a class="cta" href="https://tracked.example.com" target="_blank">Go</a>'
		);
	});
});
