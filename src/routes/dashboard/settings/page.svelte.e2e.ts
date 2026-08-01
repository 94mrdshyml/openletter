import { expect, test } from '@playwright/test';
import { loginAsTestReader, loginAsTestWriter } from '../../../lib/test/auth';

// Matches the origin playwright serves the app on (see playwright.config.ts
// webServer.port). Form actions need a same-origin Origin header or
// SvelteKit's CSRF check rejects them before authorization is even reached —
// so sending it is what makes these tests exercise the real auth gate.
const BASE = `http://localhost:${process.env.E2E_PORT ?? 4173}`;

test('stays on /dashboard/settings when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/settings');
});

test('shows the publication settings fields', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await expect(page.getByLabel('Publication name')).toHaveValue('The Meridian');
	await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
});

test('saves publication changes for real', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByLabel('Tagline').fill('Updated tagline for real');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Tagline')).toHaveValue('Updated tagline for real');
});

test('sends an admin invite', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByPlaceholder('colleague@example.com').fill('new-admin@example.com');
	await page.getByRole('button', { name: 'Send invite' }).click();
	await expect(page.getByText('Invitation sent.')).toBeVisible();
});

// --- Authorization (negative paths) -----------------------------------------
// SvelteKit runs form actions BEFORE load functions, so the guard in
// dashboard/+layout.server.ts never protected these actions. These tests POST
// to the actions directly, which is the only way to cover that gap — a
// page.goto() test passes even when the actions are wide open.

// A redirect thrown from hooks during a form-action POST comes back as an
// HTTP 200 carrying SvelteKit's action-result envelope, not a bare 303 (a
// plain GET does get a real 303). So assert on the envelope: seeing the
// /login redirect there proves the gate ran and the action's own result was
// never produced. Verified against the built worker, not assumed.
const GATED = { type: 'redirect', status: 303, location: '/login' };

test('blocks an unauthenticated POST to the invite action', async ({ page }) => {
	const res = await page.request.post('/dashboard/settings?/invite', {
		form: { email: 'attacker@example.com' },
		headers: { origin: BASE }
	});
	expect(await res.json()).toMatchObject(GATED);
});

test('blocks an unauthenticated POST to the save action', async ({ page }) => {
	const res = await page.request.post('/dashboard/settings?/save', {
		form: { name: 'Hijacked', resendFromEmail: 'attacker@example.com' },
		headers: { origin: BASE }
	});
	expect(await res.json()).toMatchObject(GATED);
});

test('a reader cannot escalate to admin via the invite action', async ({ page }) => {
	await loginAsTestReader(page, 'reader-escalation@example.com');

	const res = await page.request.post('/dashboard/settings?/invite', {
		form: { email: 'reader-escalation@example.com' },
		headers: { origin: BASE }
	});
	expect(await res.json()).toMatchObject(GATED);

	// Still not an admin afterwards — no invitation was issued to escalate with.
	await page.goto('/dashboard');
	expect(page.url()).not.toContain('/dashboard');
});

test('a reader cannot rewrite publication settings', async ({ page }) => {
	await loginAsTestReader(page, 'reader-settings@example.com');

	const res = await page.request.post('/dashboard/settings?/save', {
		form: { name: 'Hijacked', resendFromEmail: 'attacker@example.com' },
		headers: { origin: BASE }
	});
	expect(await res.json()).toMatchObject(GATED);
});

test('a reader cannot load the settings page', async ({ page }) => {
	await loginAsTestReader(page, 'reader-settings-page@example.com');
	await page.goto('/dashboard/settings');
	// /login bounces an authenticated reader onward to /, so assert the
	// security-relevant fact rather than a specific landing URL.
	expect(page.url()).not.toContain('/dashboard');
});
