// Every route redirects to /setup until an admin exists (see hooks.server.ts).
// Without completing setup once here, every other e2e test would immediately
// redirect and fail. Uses the real /setup form action (not a raw D1 insert),
// so this doubles as a positive-path test of the setup flow itself.
import { request } from '@playwright/test';

export default async function globalSetup() {
	const baseURL = 'http://localhost:4173';
	const ctx = await request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
	const res = await ctx.post('/setup', {
		multipart: {
			email: 'test-admin@example.com',
			firstName: 'Test',
			lastName: 'Admin',
			pubName: 'The Meridian'
		}
	});
	if (!res.ok() && res.status() !== 303) {
		throw new Error(`e2e globalSetup: /setup POST failed with ${res.status()}`);
	}
	await ctx.dispose();
}
