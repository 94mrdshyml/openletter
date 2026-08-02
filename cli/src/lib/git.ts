import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { run } from './exec.js';

export const TEMPLATE_REPO = 'https://github.com/94mrdshyml/openletter.git';

/**
 * Clones the OpenLetter repo as a starting point for a new publication:
 * shallow clone (no history), strip `.git` so the writer owns a fresh repo
 * of their own, and drop `cli/` — a deployed publication doesn't need to
 * ship a copy of the CLI that created it.
 */
export async function cloneTemplate(targetDir: string): Promise<void> {
	await run('git', ['clone', '--depth', '1', TEMPLATE_REPO, targetDir], process.cwd());
	await rm(join(targetDir, '.git'), { recursive: true, force: true });
	await rm(join(targetDir, 'cli'), { recursive: true, force: true });
}
