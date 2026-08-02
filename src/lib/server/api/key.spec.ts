import { describe, expect, it } from 'vitest';
import { generateApiKey } from './key';
import { sha256Hex } from './crypto';

describe('generateApiKey', () => {
	it('produces an ol_-prefixed raw key, a matching hash, and the last four hex chars', async () => {
		const { raw, hash, lastFour } = await generateApiKey();

		expect(raw).toMatch(/^ol_[0-9a-f]{64}$/);
		expect(hash).toBe(await sha256Hex(raw));
		expect(lastFour).toBe(raw.slice(-4));
	});

	it('generates unique raw keys', async () => {
		const a = await generateApiKey();
		const b = await generateApiKey();
		expect(a.raw).not.toBe(b.raw);
	});
});
