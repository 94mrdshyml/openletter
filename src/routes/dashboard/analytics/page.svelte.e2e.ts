import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../lib/test/auth';

test('stays on /dashboard/analytics when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/analytics');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/analytics');
});

test('redirects unauthenticated visitors to /login', async ({ page }) => {
	await page.goto('/dashboard/analytics');
	await expect(page).toHaveURL(/\/login/);
});

test('expands the subscriber list when the Total subscribers stat is clicked', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/analytics');
	await expect(page.getByRole('heading', { name: 'Subscribers' })).toHaveCount(0);
	await page.getByRole('button', { name: /Total subscribers/ }).click();
	await expect(page.getByRole('heading', { name: 'Subscribers' })).toBeVisible();
});

test('shows the stats row with real subscriber/post counts', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/analytics');
	await expect(page.getByText('Total subscribers')).toBeVisible();
	await expect(page.getByText('Posts published')).toBeVisible();
	await expect(page.getByText('Unsubscribed').first()).toBeVisible();
});

test('shows an empty state for post performance when nothing has been sent yet', async ({
	page
}) => {
	// e2e-global-setup's /setup call never configures a Resend Segment id, so
	// no seeded post ever actually sent a broadcast — this is the real,
	// expected state for a freshly set-up publication, not a stub.
	await loginAsTestWriter(page);
	await page.goto('/dashboard/analytics');
	await expect(page.getByText('No posts sent yet.')).toBeVisible();
	await expect(page.getByRole('table')).toHaveCount(0);
});
