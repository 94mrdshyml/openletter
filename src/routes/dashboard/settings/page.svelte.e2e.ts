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

test('shows the personalization fields with a live preview', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await expect(page.getByLabel('Heading font')).toHaveValue('Archivo');
	await expect(page.getByLabel('Body font')).toHaveValue('Archivo');
	await expect(page.getByLabel('Brand color')).toHaveValue('#ec3013');
	await expect(page.getByText('Preview')).toBeVisible();
});

test('warns when a picked accent color has poor button-text contrast', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	// The shipped default brand color itself only reaches ~3.76:1 with the
	// design system's light button text — below full AA (see lib/color.ts's
	// READABILITY_FLOOR comment) — so it's the real case the warning exists for.
	await page.getByLabel('Brand color').fill('#ec3013');
	// \s+ rather than a literal space: the source template's line wrap lands
	// a real newline between these two words in the SSR'd text node (Svelte
	// doesn't collapse static-text whitespace at compile time the way a
	// browser collapses it visually), so a literal-space regex is brittle
	// against reformatting.
	await expect(page.getByText(/below the recommended\s+4\.5:1/)).toBeVisible();

	// A very dark accent should clear it cleanly.
	await page.getByLabel('Brand color').fill('#201e1d');
	await expect(page.getByText(/meets accessibility\s+guidelines/)).toBeVisible();
});

test('saves personalization changes for real', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByLabel('Heading font').selectOption('Poppins');
	await page.getByLabel('Body font').selectOption('Libre Franklin');
	await page.getByLabel('Brand color').fill('#2b6cb0');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Heading font')).toHaveValue('Poppins');
	await expect(page.getByLabel('Body font')).toHaveValue('Libre Franklin');
	await expect(page.getByLabel('Brand color')).toHaveValue('#2b6cb0');
});

test('saves the webhook signing secret, never round-tripping its value', async ({ page }) => {
	// Doesn't assert the pristine "Not set" starting placeholder — other
	// specs (e.g. the webhook endpoint's own e2e tests) configure a secret
	// against this same single-publication row, and test files can run in
	// parallel, so "unset" isn't a safe assumption here. Only the save/
	// blank-keeps-current behavior below is what this test actually owns.
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');

	await page.getByLabel('Resend webhook signing secret').fill('whsec_testonlysecretvalue');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	await page.reload();
	// The raw secret is never sent back to the client — only whether one is
	// set, shown as a masked placeholder, same pattern as the API key field.
	await expect(page.getByLabel('Resend webhook signing secret')).toHaveAttribute(
		'placeholder',
		'••••••••••••••••'
	);
	await expect(page.getByLabel('Resend webhook signing secret')).toHaveValue('');

	// Saving again with the field left blank keeps the secret, doesn't clear it.
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();
	await page.reload();
	await expect(page.getByLabel('Resend webhook signing secret')).toHaveAttribute(
		'placeholder',
		'••••••••••••••••'
	);
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

test('an invalid accent color or font is silently ignored, not stored', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	const previousFont = await page.getByLabel('Heading font').inputValue();
	const previousColor = await page.getByLabel('Brand color').inputValue();

	// Bypasses the <select>/<input type="color"> UI, which can never produce
	// these values on their own — this is the actual server-side guard
	// (isValidHexColor / isValidFont), since these fields feed an inline
	// style and a Google Fonts URL in the root layout.
	const res = await page.request.post('/dashboard/settings?/save', {
		form: {
			name: 'The Meridian',
			accentColor: '"><script>alert(1)</script>',
			headingFont: 'NotARealFont; DROP TABLE publication;'
		},
		headers: { origin: BASE }
	});
	expect(res.ok()).toBe(true);

	await page.reload();
	await expect(page.getByLabel('Heading font')).toHaveValue(previousFont);
	await expect(page.getByLabel('Brand color')).toHaveValue(previousColor);
});

test('a reader cannot load the settings page', async ({ page }) => {
	await loginAsTestReader(page, 'reader-settings-page@example.com');
	await page.goto('/dashboard/settings');
	// /login bounces an authenticated reader onward to /, so assert the
	// security-relevant fact rather than a specific landing URL.
	expect(page.url()).not.toContain('/dashboard');
});
