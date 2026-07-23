import { describe, it, expect } from 'vitest';
import { formatPostDate, formatPostDateShort } from './format';

describe('formatPostDate', () => {
	it('formats an ISO date as a long-form display date', () => {
		expect(formatPostDate('2026-07-18')).toBe('July 18, 2026');
	});

	it('pads single-digit days correctly', () => {
		expect(formatPostDate('2026-06-04')).toBe('June 4, 2026');
	});
});

describe('formatPostDateShort', () => {
	it('formats an ISO date as a short month/day date', () => {
		expect(formatPostDateShort('2026-07-18')).toBe('Jul 18');
	});
});
