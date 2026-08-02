#!/usr/bin/env bun
import { Command } from 'commander';
import { createCommand } from '../src/commands/create.js';
import { deployCommand } from '../src/commands/deploy.js';
import { d1CreateCommand } from '../src/commands/d1.js';
import { r2CreateCommand } from '../src/commands/r2.js';
import { secretsSetCommand } from '../src/commands/secrets.js';
import { CommandError } from '../src/lib/exec.js';

const program = new Command();

program
	.name('openletter')
	.description('Scaffold, provision, and deploy a self-hosted OpenLetter publication on Cloudflare')
	.version('0.1.0');

program
	.command('create')
	.description('Scaffold a new publication, provision Cloudflare resources, and deploy it')
	.argument('[name]', 'Publication name')
	.action(createCommand);

program
	.command('deploy')
	.description(
		'Apply pending D1 migrations and deploy the Worker (run inside a scaffolded project)'
	)
	.action(deployCommand);

const d1 = program.command('d1').description('Manage the D1 database');
d1.command('create')
	.description('Create a D1 database, bind it in wrangler.jsonc, and apply migrations')
	.argument('[name]', 'Database name (defaults to the Worker name in wrangler.jsonc)')
	.action(d1CreateCommand);

const r2 = program.command('r2').description('Manage the R2 media bucket');
r2.command('create')
	.description('Create an R2 bucket, bind it in wrangler.jsonc, and enable its public URL')
	.argument('[name]', 'Bucket name', 'openletter-media')
	.action(r2CreateCommand);

const secrets = program.command('secrets').description('Manage Worker secrets');
secrets
	.command('set')
	.description('Set a Worker secret (defaults to BETTER_AUTH_SECRET)')
	.argument('[name]', 'Secret name', 'BETTER_AUTH_SECRET')
	.option('--generate', 'Generate a random 32-byte hex value instead of prompting', false)
	.action((name: string, opts: { generate: boolean }) => secretsSetCommand(name, opts));

async function main() {
	try {
		await program.parseAsync();
	} catch (err) {
		if (err instanceof CommandError) {
			console.error(`\n✖ ${err.message}`);
		} else {
			console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
		}
		process.exit(1);
	}
}

main();
