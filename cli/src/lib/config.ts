import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONFIG_FILE = 'wrangler.jsonc';

// wrangler.jsonc in this project is plain JSON today (no // comments), so a
// straight JSON round-trip is safe. If comments are ever added, this needs
// to switch to a comment-preserving parser (e.g. jsonc-parser) instead.
export interface WranglerConfig {
	name: string;
	vars?: Record<string, string>;
	d1_databases?: Array<{ binding: string; database_name: string; database_id: string }>;
	r2_buckets?: Array<{ binding: string; bucket_name: string }>;
	[key: string]: unknown;
}

export function configPath(cwd: string): string {
	return join(cwd, CONFIG_FILE);
}

export async function readConfig(cwd: string): Promise<WranglerConfig> {
	const raw = await readFile(configPath(cwd), 'utf8');
	return JSON.parse(raw);
}

export async function writeConfig(cwd: string, config: WranglerConfig): Promise<void> {
	await writeFile(configPath(cwd), JSON.stringify(config, null, '\t') + '\n', 'utf8');
}

/**
 * Strips the resource bindings that came from the cloned template (they point
 * at the original repo's own Cloudflare account) and sets the new Worker
 * name, so `wrangler ... --update-config` starts from a clean slate instead
 * of merging against someone else's database_id / bucket_name.
 */
export async function resetForNewPublication(cwd: string, workerName: string): Promise<void> {
	const config = await readConfig(cwd);
	config.name = workerName;
	config.d1_databases = [];
	config.r2_buckets = [];
	if (config.vars && typeof config.vars === 'object') {
		delete (config.vars as Record<string, string>).MEDIA_PUBLIC_URL;
	}
	await writeConfig(cwd, config);
}

export async function setVar(cwd: string, key: string, value: string): Promise<void> {
	const config = await readConfig(cwd);
	config.vars = { ...(config.vars ?? {}), [key]: value };
	await writeConfig(cwd, config);
}
