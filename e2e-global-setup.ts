// Every route redirects to /setup until an admin exists (see hooks.server.ts).
// Without completing setup once here, every other e2e test would immediately
// redirect and fail. Uses the real /setup form action (not a raw D1 insert),
// so this doubles as a positive-path test of the setup flow itself. Also
// seeds one published post and one draft through the real editor actions
// (not a raw D1 insert either) — existing specs assert on specific
// title/slug/excerpt text, which used to come from mock-data.ts and now
// needs to exist for real.
import { request } from '@playwright/test';

export default async function globalSetup() {
	const baseURL = 'http://localhost:4173';
	const ctx = await request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });

	const setupRes = await ctx.post('/setup', {
		multipart: {
			email: 'test-admin@example.com',
			firstName: 'Test',
			lastName: 'Admin',
			pubName: 'The Meridian',
			resendApiKey: 'test_resend_key',
			resendFromEmail: 'test@example.com'
		}
	});
	if (!setupRes.ok() && setupRes.status() !== 303) {
		throw new Error(`e2e globalSetup: /setup POST failed with ${setupRes.status()}`);
	}

	// /api/test/login returns cookies as a JSON body rather than real
	// Set-Cookie headers (loginAsTestWriter's page helper applies them via
	// BrowserContext.addCookies, which this plain APIRequestContext doesn't
	// have) — so the session token is forwarded manually as a Cookie header
	// on the seed requests below instead.
	const loginRes = await ctx.get('/api/test/login');
	const { cookies } = (await loginRes.json()) as { cookies: { name: string; value: string }[] };
	const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

	const publishRes = await ctx.post('/dashboard/posts/new?/publish', {
		headers: { Cookie: cookieHeader },
		multipart: {
			title: 'The Quiet Realignment of Central Asian Gas Routes',
			subtitle: '',
			slug: 'quiet-realignment-central-asian-gas-routes',
			excerpt:
				"Turkmenistan's new pipeline agreement with Azerbaijan bypasses Russia entirely — a shift three decades in the making that redraws the energy map of Central Asia.",
			body: '<p>Turkmenistan signed a framework agreement with Azerbaijan last week for the construction of a subsea pipeline across the Caspian.</p>',
			wall: 'public',
			coverImageUrl: '',
			scheduledAt: ''
		}
	});
	if (!publishRes.ok() && publishRes.status() !== 303) {
		throw new Error(`e2e globalSetup: publish post failed with ${publishRes.status()}`);
	}

	const draftRes = await ctx.post('/dashboard/posts/new?/save', {
		headers: { Cookie: cookieHeader },
		multipart: {
			title: "The South China Sea's Quiet Insurance War",
			subtitle: '',
			slug: 'south-china-sea-insurance-war',
			excerpt: '',
			body: '<p>Continue writing...</p>',
			wall: 'public',
			coverImageUrl: ''
		}
	});
	if (!draftRes.ok() && draftRes.status() !== 303) {
		throw new Error(`e2e globalSetup: draft post failed with ${draftRes.status()}`);
	}

	await ctx.dispose();
}
