import { expect, test } from '@playwright/test';

test('stays on /login when navigated to', async ({ page }) => {
	await page.goto('/login');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/login');
});

test('shows the email field and submit button', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByLabel('Email address')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
});

test('navigates to check-email on submit', async ({ page }) => {
	await page.goto('/login');
	await page.getByLabel('Email address').fill('writer@themeridian.pub');
	await page.getByRole('button', { name: 'Send sign-in link' }).click();
	await expect(page).toHaveURL(/\/login\/check-email/);
});
