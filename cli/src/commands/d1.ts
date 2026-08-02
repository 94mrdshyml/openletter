import * as p from '@clack/prompts';
import { readConfig } from '../lib/config.js';
import * as wrangler from '../lib/wrangler.js';

export async function d1CreateCommand(rawName: string | undefined): Promise<void> {
	const cwd = process.cwd();
	p.intro('openletter d1 create');

	const config = await readConfig(cwd).catch(() => null);
	const name = rawName ?? config?.name ?? 'openletter';

	await wrangler.ensureLoggedIn(cwd);

	const s = p.spinner();
	s.start(`Creating D1 database "${name}"`);
	await wrangler.d1Create(cwd, name);
	s.stop('D1 database created and bound in wrangler.jsonc');

	s.start('Applying migrations');
	await wrangler.d1MigrationsApply(cwd, name);
	s.stop('Migrations applied');

	p.outro('Done.');
}
