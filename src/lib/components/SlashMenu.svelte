<script lang="ts">
	import type { SlashCommandItem } from '$lib/tiptap/slash-items';

	let {
		items,
		selectedIndex,
		onSelect
	}: {
		items: SlashCommandItem[];
		selectedIndex: number;
		onSelect: (item: SlashCommandItem) => void;
	} = $props();
</script>

<div class="slash-menu" role="listbox" aria-label="Insert block">
	{#if items.length === 0}
		<div class="slash-menu-empty">No matching blocks</div>
	{:else}
		{#each items as item, i (item.title)}
			<button
				type="button"
				class="slash-menu-item"
				class:active={i === selectedIndex}
				role="option"
				aria-selected={i === selectedIndex}
				onmousedown={(e) => {
					e.preventDefault();
					onSelect(item);
				}}
			>
				<span class="slash-menu-item-title">{item.title}</span>
				<span class="slash-menu-item-desc">{item.description}</span>
			</button>
		{/each}
	{/if}
</div>

<style>
	.slash-menu {
		display: flex;
		flex-direction: column;
		min-width: 220px;
		max-height: 320px;
		overflow-y: auto;
		padding: 4px;
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		box-shadow: var(--shadow-md);
		font-size: 13px;
	}
	.slash-menu-empty {
		padding: 8px 10px;
		color: var(--color-neutral-500);
	}
	.slash-menu-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1px;
		width: 100%;
		padding: 6px 10px;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--color-text);
	}
	.slash-menu-item.active {
		background: var(--color-accent-100);
	}
	.slash-menu-item-title {
		font-weight: 600;
	}
	.slash-menu-item-desc {
		font-size: 11px;
		color: var(--color-neutral-500);
	}
</style>
