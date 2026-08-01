import { expect, test } from '@playwright/test';

test('shows a missing-email state with no email param', async ({ page }) => {
	await page.goto('/unsubscribe');
	await expect(page.getByRole('heading', { name: 'Missing email' })).toBeVisible();
});

test('shows a confirm step for a given email, then a result after confirming', async ({ page }) => {
	await page.goto('/unsubscribe?email=reader-unsub-test@example.com');
	await expect(page.getByRole('heading', { name: 'Unsubscribe?' })).toBeVisible();
	await expect(page.getByText('reader-unsub-test@example.com')).toBeVisible();

	await page.getByRole('button', { name: 'Confirm unsubscribe' }).click();
	// e2e's Resend API key is a placeholder (see e2e-global-setup.ts), so the
	// real PATCH /contacts/.../topics call genuinely fails auth — this
	// exercises the real failure path (an honest error, not a silent fake
	// "success", per the page's own design). See docs/SESSION_LOG.md.
	await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
});
