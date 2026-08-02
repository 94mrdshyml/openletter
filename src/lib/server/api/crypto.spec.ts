import { describe, expect, it } from 'vitest';
import { sha256Hex, timingSafeEqual } from './crypto';

describe('sha256Hex', () => {
	it('matches a known SHA-256 vector', async () => {
		expect(await sha256Hex('')).toBe(
			'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
		);
		expect(await sha256Hex('abc')).toBe(
			'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
		);
	});

	it('is deterministic and 64 hex chars', async () => {
		const a = await sha256Hex('ol_test');
		const b = await sha256Hex('ol_test');
		expect(a).toBe(b);
		expect(a).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe('timingSafeEqual', () => {
	it('returns true for identical strings', () => {
		expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
	});

	it('returns false for different strings of the same length', () => {
		expect(timingSafeEqual('abc123', 'abc124')).toBe(false);
	});

	it('returns false for different-length strings', () => {
		expect(timingSafeEqual('abc', 'abcd')).toBe(false);
	});
});
