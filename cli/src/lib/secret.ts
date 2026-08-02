import { randomBytes } from 'node:crypto';

/** Matches the `openssl rand -hex 32` example in .dev.vars.example — 32 random bytes, hex-encoded. */
export function generateBetterAuthSecret(): string {
	return randomBytes(32).toString('hex');
}
