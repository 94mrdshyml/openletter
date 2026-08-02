import * as p from '@clack/prompts';
import { generateBetterAuthSecret } from '../lib/secret.js';
import * as wrangler from '../lib/wrangler.js';

export async function secretsSetCommand(
	name: string,
	options: { generate: boolean }
): Promise<void> {
	const cwd = process.cwd();
	p.intro('openletter secrets set');

	await wrangler.ensureLoggedIn(cwd);

	let value: string;
	if (options.generate) {
		value = generateBetterAuthSecret();
	} else {
		const answer = await p.password({ message: `Value for ${name}` });
		if (p.isCancel(answer)) {
			p.cancel('Cancelled.');
			process.exit(1);
		}
		value = answer;
	}

	const s = p.spinner();
	s.start(`Setting ${name}`);
	await wrangler.secretPut(cwd, name, value);
	s.stop('Secret set');

	p.outro('Done.');
}
