import { describe, it, expect } from 'vitest';
import { applyHeadingFontToBody } from './mail';

describe('applyHeadingFontToBody', () => {
	it('adds a font-family style to a heading with no existing attributes', () => {
		const out = applyHeadingFontToBody('<h2>Section</h2>', 'Poppins');
		expect(out).toBe('<h2 style="font-family:Poppins,Helvetica,Arial,sans-serif">Section</h2>');
	});

	it('merges with an existing style attribute rather than dropping it', () => {
		const out = applyHeadingFontToBody('<h3 style="color:red">Sub</h3>', 'Fraunces');
		expect(out).toBe(
			'<h3 style="font-family:Fraunces,Helvetica,Arial,sans-serif;color:red">Sub</h3>'
		);
	});

	it('preserves non-style attributes', () => {
		const out = applyHeadingFontToBody('<h2 id="intro">Hi</h2>', 'Inter');
		expect(out).toBe('<h2 id="intro" style="font-family:Inter,Helvetica,Arial,sans-serif">Hi</h2>');
	});

	it('leaves paragraphs and other tags untouched', () => {
		const out = applyHeadingFontToBody('<p>Text</p><h2>Head</h2><p>More</p>', 'Inter');
		expect(out).toBe(
			'<p>Text</p><h2 style="font-family:Inter,Helvetica,Arial,sans-serif">Head</h2><p>More</p>'
		);
	});

	it('handles multiple headings independently', () => {
		const out = applyHeadingFontToBody('<h2>One</h2><h3>Two</h3>', 'Sora');
		expect(out).toBe(
			'<h2 style="font-family:Sora,Helvetica,Arial,sans-serif">One</h2><h3 style="font-family:Sora,Helvetica,Arial,sans-serif">Two</h3>'
		);
	});
});
