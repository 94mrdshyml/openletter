<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatPostDateShort } from '$lib/format';
	import DraftIcon from '$lib/components/icons/DraftIcon.svelte';
	import PublishedIcon from '$lib/components/icons/PublishedIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');

	function isScheduled(publishedAt: Date | null): boolean {
		return !!publishedAt && publishedAt > new Date();
	}
</script>

<svelte:head>
	<title>Posts · {name}</title>
</svelte:head>

<div class="container" style="padding:40px">
	<div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 32px">
		<h2 style="font-size:28px;margin:0;letter-spacing:-0.02em">Posts</h2>
		<a
			href={resolve('/dashboard/posts/new')}
			class="btn btn-primary"
			style="padding:10px 24px;font-size:14px;min-height:42px;gap:8px"
		>
			<PlusIcon />
			New post
		</a>
	</div>

	{#if data.drafts.length > 0}
		<h6
			style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
		>
			Drafts
		</h6>
		<div style="border-top:2px solid var(--color-divider);margin:0 0 32px">
			{#each data.drafts as draft (draft.id)}
				<a
					href={resolve('/dashboard/posts/[id]', { id: draft.id })}
					style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--color-divider);text-decoration:none;color:inherit"
				>
					<DraftIcon />
					<span style="font-family:var(--font-heading);font-weight:800;font-size:15px;flex:1"
						>{draft.title}</span
					>
					<span
						class="btn-ghost"
						style="font-size:12px;color:var(--color-accent);font-family:var(--font-heading);font-weight:800"
						>Edit</span
					>
				</a>
			{/each}
		</div>
	{/if}

	<h6
		style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
	>
		Published
	</h6>
	<div style="border-top:2px solid var(--color-divider)">
		{#each data.published as p (p.id)}
			<a
				href={resolve('/dashboard/posts/[id]', { id: p.id })}
				style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--color-divider);text-decoration:none;color:inherit"
			>
				<PublishedIcon />
				<span style="font-family:var(--font-heading);font-weight:800;font-size:15px;flex:1"
					>{p.title}</span
				>
				{#if isScheduled(p.publishedAt)}
					<span class="tag tag-outline" style="font-size:10px">Scheduled</span>
				{/if}
				{#if p.publishedAt}
					<span style="font-size:12px;color:var(--color-neutral-500)"
						>{formatPostDateShort(p.publishedAt.toISOString().slice(0, 10))}</span
					>
				{/if}
				<span
					class="btn-ghost"
					style="font-size:12px;color:var(--color-accent);font-family:var(--font-heading);font-weight:800"
					>Edit</span
				>
			</a>
		{/each}
	</div>
</div>
