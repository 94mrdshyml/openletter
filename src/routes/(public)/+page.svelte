<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatPostDate } from '$lib/format';
	import SubscribeForm from '$lib/components/SubscribeForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
	const description = $derived(page.data.publication?.description ?? '');
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<div class="container" style="padding:56px clamp(20px, 8vw, 90px) 48px">
	<h1 style="font-size:48px;line-height:1.05;margin:0 0 12px;letter-spacing:-0.025em">
		{name}
	</h1>
	<p
		style="font-size:17px;color:var(--color-neutral-600);margin:0 0 36px;max-width:420px;line-height:1.5"
	>
		{description}
	</p>
	<div style="margin:0 0 56px">
		<SubscribeForm maxWidth="440px" />
	</div>

	{#if data.posts.length === 0}
		<div style="border-top:2px solid var(--color-divider);padding:40px 0">
			<p
				style="font-size:17px;color:var(--color-neutral-600);margin:0;line-height:1.6;max-width:480px"
			>
				This publication is just getting started. Subscribe to receive the first post the moment
				it's ready.
			</p>
		</div>
	{:else}
		<div style="border-top:2px solid var(--color-divider)">
			{#each data.posts as post, i (post.slug)}
				<a
					href={resolve('/(public)/p/[slug]', { slug: post.slug })}
					class="post-row"
					style="display:flex;gap:24px;align-items:flex-start;padding:28px 0;text-decoration:none;color:inherit;{i <
					data.posts.length - 1
						? 'border-bottom:1px solid var(--color-divider)'
						: ''}"
				>
					{#if post.coverImageUrl}
						<img
							src={post.coverImageUrl}
							alt=""
							style="width:180px;aspect-ratio:1200/630;object-fit:cover;flex-shrink:0"
						/>
					{/if}
					<div style="flex:1;min-width:0">
						<h3
							class="post-row-title"
							style="font-size:22px;margin:0 0 6px;line-height:1.2;letter-spacing:-0.015em"
						>
							{post.title}
						</h3>
						<div style="font-size:13px;color:var(--color-neutral-500);margin:0 0 8px">
							{formatPostDate(post.publishedAt!.toISOString().slice(0, 10))}
						</div>
						<p
							style="font-size:15px;color:var(--color-neutral-700);margin:0;line-height:1.55;max-width:580px"
						>
							{post.excerpt}
						</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
<div style="border-top:2px solid var(--color-divider)">
	<div
		class="container"
		style="padding:32px clamp(20px, 8vw, 90px);font-size:13px;color:var(--color-neutral-500)"
	>
		{name} · Powered by OpenLetter
	</div>
</div>

<style>
	.post-row:hover .post-row-title {
		color: var(--color-accent);
	}
	@media (max-width: 520px) {
		.post-row {
			flex-direction: column;
		}
		.post-row img {
			width: 100%;
		}
	}
</style>
