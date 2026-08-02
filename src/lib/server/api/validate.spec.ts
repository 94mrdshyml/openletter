import { describe, expect, it } from 'vitest';
import { isValidEmail } from './validate';

describe('isValidEmail', () => {
	it('accepts well-formed emails', () => {
		expect(isValidEmail('reader@example.com')).toBe(true);
		expect(isValidEmail('a.b+tag@sub.example.co')).toBe(true);
	});

	it('rejects malformed input', () => {
		expect(isValidEmail('')).toBe(false);
		expect(isValidEmail('not-an-email')).toBe(false);
		expect(isValidEmail('missing@domain')).toBe(false);
		expect(isValidEmail('@example.com')).toBe(false);
		expect(isValidEmail('has spaces@example.com')).toBe(false);
	});
});
