import * as p from '@clack/prompts';
import { setVar } from '../lib/config.js';
import * as wrangler from '../lib/wrangler.js';

export async function r2CreateCommand(name: string): Promise<void> {
	const cwd = process.cwd();
	p.intro('openletter r2 create');

	await wrangler.ensureLoggedIn(cwd);

	const s = p.spinner();
	s.start(`Creating R2 bucket "${name}"`);
	await wrangler.r2BucketCreate(cwd, name);
	s.stop('R2 bucket created and bound in wrangler.jsonc');

	s.start('Enabling public access (r2.dev URL)');
	const url = await wrangler.r2DevUrlEnable(cwd, name);
	await setVar(cwd, 'MEDIA_PUBLIC_URL', url);
	s.stop(`Public media URL: ${url}`);

	p.outro('Done.');
}
