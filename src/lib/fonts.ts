// Curated Google Fonts offered for personalization (dashboard/settings).
// Fixed list, not free text — every entry is confirmed to ship the 400/600/800
// weights the design system's heading/body styles rely on (see app.css), so
// a picked font can never render in a missing weight, and the family name
// can never carry characters that would be unsafe to interpolate into a
// Google Fonts URL or an inline style attribute.
export const GOOGLE_FONTS = [
	'Archivo',
	'Inter',
	'Poppins',
	'Montserrat',
	'Work Sans',
	'DM Sans',
	'Manrope',
	'Outfit',
	'Sora',
	'Libre Franklin',
	'Fraunces',
	'Playfair Display'
] as const;

export type GoogleFont = (typeof GOOGLE_FONTS)[number];

export function isValidFont(value: string): value is GoogleFont {
	return (GOOGLE_FONTS as readonly string[]).includes(value);
}

const FONT_WEIGHTS = '400;600;800';

// One Google Fonts stylesheet request covering both selected families
// (deduped if heading/body match), matching the weights app.css uses.
export function googleFontsHref(families: string[]): string {
	const unique = [...new Set(families)];
	const query = unique
		.map((family) => `family=${family.replace(/ /g, '+')}:wght@${FONT_WEIGHTS}`)
		.join('&');
	return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
