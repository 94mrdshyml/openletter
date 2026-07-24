import { describe, expect, it } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
	it('prefixes the id with the given entity prefix', () => {
		expect(generateId('post')).toMatch(/^post_[0-9a-zA-Z]{24}$/);
		expect(generateId('pub')).toMatch(/^pub_[0-9a-zA-Z]{24}$/);
		expect(generateId('sub')).toMatch(/^sub_[0-9a-zA-Z]{24}$/);
		expect(generateId('user')).toMatch(/^user_[0-9a-zA-Z]{24}$/);
		expect(generateId('sess')).toMatch(/^sess_[0-9a-zA-Z]{24}$/);
		expect(generateId('acct')).toMatch(/^acct_[0-9a-zA-Z]{24}$/);
		expect(generateId('ver')).toMatch(/^ver_[0-9a-zA-Z]{24}$/);
	});

	it('generates unique ids', () => {
		const ids = new Set(Array.from({ length: 1000 }, () => generateId('post')));
		expect(ids.size).toBe(1000);
	});
});
