import { describe, it, expect } from 'vitest';
import { isValidHexColor, contrastRatio, pickOnAccentColor, WCAG_AA_CONTRAST } from './color';

describe('isValidHexColor', () => {
	it('accepts a 6-digit hex color', () => {
		expect(isValidHexColor('#ec3013')).toBe(true);
		expect(isValidHexColor('#EC3013')).toBe(true);
	});

	it('rejects anything else', () => {
		expect(isValidHexColor('ec3013')).toBe(false);
		expect(isValidHexColor('#fff')).toBe(false);
		expect(isValidHexColor('red')).toBe(false);
		expect(isValidHexColor('#gggggg')).toBe(false);
		expect(isValidHexColor('#ec3013; }</style><script>')).toBe(false);
	});
});

describe('contrastRatio', () => {
	it('is 21:1 for pure black on pure white', () => {
		expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
	});

	it('is 1:1 for identical colors', () => {
		expect(contrastRatio('#ec3013', '#ec3013')).toBeCloseTo(1, 5);
	});
});

describe('pickOnAccentColor', () => {
	it('picks light text for a dark accent', () => {
		const { color, meetsAA } = pickOnAccentColor('#201e1d');
		expect(color).toBe('#f3f2f2');
		expect(meetsAA).toBe(true);
	});

	it('picks dark text for a light/pale accent', () => {
		const { color, meetsAA } = pickOnAccentColor('#fff2ef');
		expect(color).toBe('#201e1d');
		expect(meetsAA).toBe(true);
	});

	it('keeps the default light button text for the shipped brand accent', () => {
		// The current default accent (#ec3013) only reaches ~3.76:1 with
		// light text — below full WCAG AA (4.5:1), but above the
		// readability floor, and it's what every existing deployment
		// already renders. It must keep picking light text, not flip to
		// dark just because dark is marginally higher (~3.95:1) — flipping
		// would silently change the shipped default's look.
		const { color, meetsAA, contrast } = pickOnAccentColor('#ec3013');
		expect(color).toBe('#f3f2f2');
		expect(meetsAA).toBe(false);
		expect(contrast).toBeLessThan(WCAG_AA_CONTRAST);
	});

	it('switches to dark text once light text drops below the readability floor', () => {
		// A pale accent where light-on-light would be genuinely unreadable —
		// this is the actual case the user asked to guard against.
		const { color, meetsAA } = pickOnAccentColor('#fdf6b2');
		expect(color).toBe('#201e1d');
		expect(meetsAA).toBe(true);
	});
});
