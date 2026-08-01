import { expect, test } from '@playwright/test';
import { loginAsTestWriter } from '../../../../lib/test/auth';

test('stays on /dashboard/posts/new when navigated to', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await page.waitForTimeout(2000);
	expect(page.url()).toContain('/dashboard/posts/new');
});

test('shows the editor toolbar and title/body fields', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('button', { name: 'Bold' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Post title' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
});

test('slash menu inserts a heading block', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	const body = page.getByRole('textbox', { name: 'Post body' });
	await expect(body).toBeVisible();
	await body.click();
	await page.keyboard.type('/head');
	await expect(page.getByRole('option', { name: /Heading 2/ })).toBeVisible();
	await page.keyboard.press('Enter');
	await expect(body.locator('h2')).toBeVisible();
});

test('slash menu filters as you type and shows no results for garbage input', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	const body = page.getByRole('textbox', { name: 'Post body' });
	await expect(body).toBeVisible();
	await body.click();
	await page.keyboard.type('/zzzznotarealblock');
	await expect(page.getByText('No matching blocks')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByText('No matching blocks')).toHaveCount(0);
});

test('bubble menu appears on text selection and toggles bold', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	const body = page.getByRole('textbox', { name: 'Post body' });
	await expect(body).toBeVisible();
	await body.click();
	await page.keyboard.type('Select this text');
	await page.keyboard.press('Control+A');
	const bubble = page.getByRole('toolbar', { name: 'Text formatting' });
	await expect(bubble).toBeVisible();
	await bubble.getByRole('button', { name: 'Bold' }).click();
	await expect(body.locator('strong')).toHaveText('Select this text');
});

test('writes a post, saves it as a draft, and it appears in the drafts list', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	// Waits for Tiptap (and the rest of the page) to finish hydrating before
	// interacting — this is a JS-heavy editor page, and typing into a native
	// input before its oninput handler attaches would type into the DOM
	// without ever reaching Svelte state, same class of bug the shadow
	// hidden-inputs redesign in PostEditor.svelte just fixed for real users.
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('A Real Draft From E2E');
	await page.getByRole('textbox', { name: 'Post body' }).click();
	await page.keyboard.type('Body text written by the e2e suite.');
	await page.getByRole('button', { name: 'Save draft' }).click();
	await expect(page).toHaveURL(/\/dashboard\/posts\/post_/);

	await page.goto('/dashboard/posts');
	await expect(page.getByText('A Real Draft From E2E')).toBeVisible();
});

test('publishing still succeeds even when the configured Resend send fails', async ({ page }) => {
	// e2e's Resend API key is a placeholder (see e2e-global-setup.ts), so once
	// a Segment id is configured, the real broadcast-send call this makes to
	// api.resend.com will genuinely fail auth — this is exactly the fail-open
	// path sendPostPublishedBroadcast is built for: the post still publishes,
	// it just doesn't get a resendBroadcastId (see mail.ts).
	await loginAsTestWriter(page);
	await page.goto('/dashboard/settings');
	await page.getByLabel('Resend Segment ID').fill('seg_e2e_test_only');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('Publish Despite Broadcast Failure');
	await page.getByRole('textbox', { name: 'Post body' }).click();
	await page.keyboard.type('This should publish even though the broadcast send fails.');
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	await page.getByRole('button', { name: 'Publish now' }).click();
	await expect(page).toHaveURL(/\/dashboard\/posts\/post_/);
});

test('opens the publish confirmation dialog', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('Publish Dialog Test');
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	await expect(page.getByText('Publish this post?')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Publish now' })).toBeVisible();
});

test('publishing makes the post visible on its public page', async ({ page }) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('A Real Published Post From E2E');
	await page.getByRole('textbox', { name: 'Post body' }).click();
	await page.keyboard.type('Published body text.');
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	await page.getByRole('button', { name: 'Publish now' }).click();

	await page.goto('/p/a-real-published-post-from-e2e');
	await expect(page.locator('h1')).toHaveText('A Real Published Post From E2E');
	await expect(page.getByText('Published body text.')).toBeVisible();
});

test('subscribers-only wall hides the body from a logged-out visitor', async ({
	page,
	context
}) => {
	await loginAsTestWriter(page);
	await page.goto('/dashboard/posts/new');
	await expect(page.getByRole('textbox', { name: 'Post body' })).toBeVisible();
	await page.getByRole('textbox', { name: 'Post title' }).fill('Gated Post From E2E');
	await page.getByRole('textbox', { name: 'Post body' }).click();
	await page.keyboard.type('Secret body only subscribers should see.');
	await page.getByLabel('Excerpt').fill('A teaser excerpt.');
	await page.getByLabel('Who can read the full post').selectOption('subscribers');
	await page.getByRole('button', { name: 'Publish', exact: true }).click();
	await page.getByRole('button', { name: 'Publish now' }).click();

	const loggedOutPage = await context
		.browser()!
		.newContext()
		.then((c) => c.newPage());
	await loggedOutPage.goto('/p/gated-post-from-e2e');
	await expect(loggedOutPage.getByText('Subscribe to keep reading')).toBeVisible();
	await expect(loggedOutPage.getByText('Secret body only subscribers should see.')).toHaveCount(0);
	await expect(loggedOutPage.getByText('A teaser excerpt.')).toBeVisible();
});
