<script lang="ts">
	import BoldIcon from './icons/BoldIcon.svelte';
	import ItalicIcon from './icons/ItalicIcon.svelte';
	import LinkIcon from './icons/LinkIcon.svelte';
	import HeadingIcon from './icons/HeadingIcon.svelte';

	let {
		rect,
		active,
		onBold,
		onItalic,
		onLink,
		onHeading
	}: {
		rect: { top: number; left: number; width: number };
		active: { bold: boolean; italic: boolean; link: boolean; heading: boolean };
		onBold: () => void;
		onItalic: () => void;
		onLink: () => void;
		onHeading: () => void;
	} = $props();
</script>

<div
	class="bubble-menu"
	role="toolbar"
	aria-label="Text formatting"
	style="top:{rect.top}px; left:{rect.left + rect.width / 2}px"
>
	<button
		type="button"
		class="bubble-menu-btn"
		class:active={active.bold}
		title="Bold"
		aria-label="Bold"
		onmousedown={(e) => {
			e.preventDefault();
			onBold();
		}}
	>
		<BoldIcon />
	</button>
	<button
		type="button"
		class="bubble-menu-btn"
		class:active={active.italic}
		title="Italic"
		aria-label="Italic"
		onmousedown={(e) => {
			e.preventDefault();
			onItalic();
		}}
	>
		<ItalicIcon />
	</button>
	<button
		type="button"
		class="bubble-menu-btn"
		class:active={active.link}
		title="Link"
		aria-label="Link"
		onmousedown={(e) => {
			e.preventDefault();
			onLink();
		}}
	>
		<LinkIcon />
	</button>
	<button
		type="button"
		class="bubble-menu-btn"
		class:active={active.heading}
		title="Heading"
		aria-label="Heading"
		onmousedown={(e) => {
			e.preventDefault();
			onHeading();
		}}
	>
		<HeadingIcon />
	</button>
</div>

<style>
	.bubble-menu {
		position: fixed;
		transform: translate(-50%, calc(-100% - 8px));
		display: flex;
		gap: 2px;
		padding: 4px;
		background: var(--color-neutral-900);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		z-index: 20;
	}
	.bubble-menu-btn {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--color-neutral-100);
		cursor: pointer;
	}
	.bubble-menu-btn:hover {
		background: color-mix(in srgb, white 15%, transparent);
	}
	.bubble-menu-btn.active {
		background: var(--color-accent);
		color: var(--color-on-accent, var(--color-bg));
	}
</style>
