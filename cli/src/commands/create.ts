import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import { run } from '../lib/exec.js';
import { cloneTemplate } from '../lib/git.js';
import { resetForNewPublication, setVar } from '../lib/config.js';
import { generateBetterAuthSecret } from '../lib/secret.js';
import { slugify } from '../lib/slug.js';
import * as wrangler from '../lib/wrangler.js';

export async function createCommand(rawName: string | undefined): Promise<void> {
	p.intro('openletter create');

	let pubName = rawName;
	if (!pubName) {
		const answer = await p.text({
			message: 'Publication name',
			placeholder: 'My Newsletter',
			validate: (value) => (value.trim() ? undefined : 'Required')
		});
		if (p.isCancel(answer)) {
			p.cancel('Cancelled.');
			process.exit(1);
		}
		pubName = answer;
	}

	const slug = slugify(pubName);
	const targetDir = resolve(process.cwd(), slug);

	if (existsSync(targetDir)) {
		p.cancel(`./${slug} already exists — remove it or choose a different name.`);
		process.exit(1);
	}

	const s = p.spinner();

	s.start('Cloning OpenLetter template');
	await cloneTemplate(targetDir);
	s.stop('Template cloned');

	s.start('Installing dependencies (bun install)');
	await run('bun', ['install'], targetDir);
	s.stop('Dependencies installed');

	p.log.step('Checking Cloudflare login');
	await wrangler.ensureLoggedIn(targetDir);

	s.start(`Resetting wrangler.jsonc for "${slug}"`);
	await resetForNewPublication(targetDir, slug);
	s.stop(`Worker name set to "${slug}"`);

	s.start(`Creating D1 database "${slug}"`);
	await wrangler.d1Create(targetDir, slug);
	s.stop('D1 database created');

	s.start('Applying database migrations');
	await wrangler.d1MigrationsApply(targetDir, slug);
	s.stop('Migrations applied');

	const bucketName = `${slug}-media`;
	s.start(`Creating R2 bucket "${bucketName}"`);
	await wrangler.r2BucketCreate(targetDir, bucketName);
	s.stop('R2 bucket created');

	s.start('Enabling public access for the R2 bucket');
	const mediaUrl = await wrangler.r2DevUrlEnable(targetDir, bucketName);
	await setVar(targetDir, 'MEDIA_PUBLIC_URL', mediaUrl);
	s.stop(`Public media URL: ${mediaUrl}`);

	s.start('Generating and setting BETTER_AUTH_SECRET');
	await wrangler.secretPut(targetDir, 'BETTER_AUTH_SECRET', generateBetterAuthSecret());
	s.stop('Secret set');

	s.start('Deploying to Cloudflare Workers');
	await wrangler.deploy(targetDir);
	s.stop('Deployed');

	p.outro(
		`Publication scaffolded in ./${slug}\n\n` +
			`Open your Worker's URL + /setup to finish onboarding — create the admin\n` +
			`account and add your Resend API key (Resend config lives in the app, not\n` +
			`in this CLI: see /setup in the browser).`
	);
}
