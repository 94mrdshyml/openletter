import * as p from '@clack/prompts';
import { readConfig } from '../lib/config.js';
import * as wrangler from '../lib/wrangler.js';

export async function deployCommand(): Promise<void> {
	const cwd = process.cwd();
	p.intro('openletter deploy');

	const config = await readConfig(cwd).catch(() => {
		p.cancel('No wrangler.jsonc found here — run this inside a scaffolded OpenLetter project.');
		process.exit(1);
	});

	await wrangler.ensureLoggedIn(cwd);

	const s = p.spinner();
	const db = config.d1_databases?.[0]?.database_name;
	if (db) {
		s.start('Applying pending D1 migrations');
		await wrangler.d1MigrationsApply(cwd, db);
		s.stop('Migrations applied');
	} else {
		p.log.warn('No D1 database bound in wrangler.jsonc — skipping migrations.');
	}

	s.start('Deploying to Cloudflare Workers');
	await wrangler.deploy(cwd);
	s.stop('Deployed');

	p.outro('Done.');
}
