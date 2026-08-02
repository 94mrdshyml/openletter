import { run, runCapture, runWithInput } from './exec.js';

// All commands shell out to the locally installed `wrangler` (a devDependency
// of the scaffolded project, see package.json) via `bunx` — this CLI never
// talks to the Cloudflare API directly, so auth is whatever `wrangler login`
// already set up. See PRD.md §2 / CLAUDE.md tech stack: "CLI: Custom, built
// on Wrangler."
const BUNX = 'bunx';

export async function whoami(cwd: string): Promise<boolean> {
	try {
		const output = await runCapture(BUNX, ['wrangler', 'whoami'], cwd);
		return !output.includes('You are not authenticated');
	} catch {
		return false;
	}
}

export async function login(cwd: string): Promise<void> {
	await run(BUNX, ['wrangler', 'login'], cwd);
}

export async function ensureLoggedIn(cwd: string): Promise<void> {
	if (await whoami(cwd)) return;
	await login(cwd);
}

export async function d1Create(cwd: string, name: string): Promise<void> {
	await run(BUNX, ['wrangler', 'd1', 'create', name, '--binding', 'DB', '--update-config'], cwd);
}

export async function d1MigrationsApply(cwd: string, database: string): Promise<void> {
	await run(BUNX, ['wrangler', 'd1', 'migrations', 'apply', database, '--remote'], cwd);
}

export async function r2BucketCreate(cwd: string, name: string): Promise<void> {
	await run(
		BUNX,
		['wrangler', 'r2', 'bucket', 'create', name, '--binding', 'MEDIA', '--update-config'],
		cwd
	);
}

/** Enables the bucket's public r2.dev URL and returns it, parsed from wrangler's own output. */
export async function r2DevUrlEnable(cwd: string, bucket: string): Promise<string> {
	const output = await runCapture(
		BUNX,
		['wrangler', 'r2', 'bucket', 'dev-url', 'enable', bucket, '-y'],
		cwd
	);
	const match = output.match(/https:\/\/pub-[a-z0-9]+\.r2\.dev/);
	if (!match) {
		throw new Error(`Could not find r2.dev URL in wrangler output:\n${output}`);
	}
	return match[0];
}

export async function secretPut(cwd: string, name: string, value: string): Promise<void> {
	await runWithInput(BUNX, ['wrangler', 'secret', 'put', name], cwd, value);
}

export async function deploy(cwd: string): Promise<void> {
	await run(BUNX, ['wrangler', 'deploy'], cwd);
}
