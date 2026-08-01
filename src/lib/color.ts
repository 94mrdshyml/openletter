// WCAG 2 contrast math for the personalization accent-color picker. Used both
// server-side (root layout, to set --color-on-accent) and client-side
// (dashboard/settings, to warn live as the writer picks a color).

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isValidHexColor(value: string): boolean {
	return HEX_RE.test(value);
}

// Design-system tokens (see app.css) — the two candidates for text sitting
// on top of the accent color.
const LIGHT_TEXT = '#f3f2f2'; // --color-bg
const DARK_TEXT = '#201e1d'; // --color-text

// WCAG AA minimum for normal-size text — used only as an informational
// threshold (see meetsAA below), not to pick the text color.
export const WCAG_AA_CONTRAST = 4.5;

// WCAG AA minimum for large-scale/bold text — used as the actual floor that
// decides whether to switch off the design system's default light button
// text. Deliberately lower than WCAG_AA_CONTRAST: the shipped default accent
// (#ec3013) only reaches ~3.76:1 with light text, which is below 4.5 but a
// real, already-shipped, legible button — picking dark text purely because
// it's marginally higher (~3.95:1) would silently change the site's default
// look for every existing deployment. Only pale/light accents that drop
// below this floor should switch to dark text; anything above it keeps the
// established light-text button, unchanged.
const READABILITY_FLOOR = 3;

function hexToRgb(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
	const [rl, gl, bl] = [r, g, b].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contrastRatio(hexA: string, hexB: string): number {
	const lA = relativeLuminance(hexToRgb(hexA));
	const lB = relativeLuminance(hexToRgb(hexB));
	const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
	return (lighter + 0.05) / (darker + 0.05);
}

// Prefers the design system's default light button text (matches every
// existing deployment's current look) and only switches to dark text when
// light text would drop below the readability floor — see READABILITY_FLOOR.
// `meetsAA` reports whether the chosen color clears full WCAG AA (4.5:1);
// this can be false even for a sensible, readable pick (the shipped default
// itself doesn't clear it) — the settings UI uses it to show an informational
// note, not to block saving.
export function pickOnAccentColor(accentHex: string): {
	color: string;
	contrast: number;
	meetsAA: boolean;
} {
	const lightContrast = contrastRatio(accentHex, LIGHT_TEXT);
	if (lightContrast >= READABILITY_FLOOR) {
		return {
			color: LIGHT_TEXT,
			contrast: lightContrast,
			meetsAA: lightContrast >= WCAG_AA_CONTRAST
		};
	}
	const darkContrast = contrastRatio(accentHex, DARK_TEXT);
	const color = darkContrast >= lightContrast ? DARK_TEXT : LIGHT_TEXT;
	const contrast = Math.max(lightContrast, darkContrast);
	return { color, contrast, meetsAA: contrast >= WCAG_AA_CONTRAST };
}
