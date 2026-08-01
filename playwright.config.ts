import { defineConfig } from '@playwright/test';

// E2E_PORT lets a local run avoid colliding with another dev server already
// bound to the default port (e.g. a second worktree's preview server) — CI
// never sets it, so it always falls back to 4173.
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
	webServer: {
		command: `bun run build && wrangler dev .svelte-kit/cloudflare/_worker.js --port ${port}`,
		port
	},
	testMatch: '**/*.e2e.{ts,js}',
	globalSetup: './e2e-global-setup.ts'
});
