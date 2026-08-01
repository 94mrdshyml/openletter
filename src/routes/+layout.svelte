<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { isValidFont, googleFontsHref } from '$lib/fonts';
	import { isValidHexColor } from '$lib/color';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// Defense in depth: the settings action only ever writes validated
	// values, but this is the one place that turns them into a live
	// stylesheet URL and inline CSS, so it re-validates rather than trusting
	// the database blindly.
	const headingFont = $derived(
		data.publication && isValidFont(data.publication.headingFont)
			? data.publication.headingFont
			: 'Archivo'
	);
	const bodyFont = $derived(
		data.publication && isValidFont(data.publication.bodyFont)
			? data.publication.bodyFont
			: 'Archivo'
	);
	const accentColor = $derived(
		data.publication && isValidHexColor(data.publication.accentColor)
			? data.publication.accentColor
			: '#ec3013'
	);
	const fontsHref = $derived(googleFontsHref([headingFont, bodyFont]));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link href={fontsHref} rel="stylesheet" />
</svelte:head>

<div
	style="display:contents; --color-accent:{accentColor}; --color-on-accent:{data.onAccentColor ??
		''}; --font-heading:'{headingFont}', system-ui, sans-serif; --font-body:'{bodyFont}', system-ui, sans-serif;"
>
	{@render children()}
</div>
