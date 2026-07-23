<script lang="ts">
	import { resolve } from '$app/paths';
	import { publication, posts } from '$lib/mock-data';
	import { formatPostDate } from '$lib/format';
	import SubscribeForm from '$lib/components/SubscribeForm.svelte';
</script>

<svelte:head>
	<title>{publication.name}</title>
</svelte:head>

<div style="padding:56px 90px 48px">
	<h1 style="font-size:48px;line-height:1.05;margin:0 0 12px;letter-spacing:-0.025em">
		{publication.name}
	</h1>
	<p
		style="font-size:17px;color:var(--color-neutral-600);margin:0 0 36px;max-width:420px;line-height:1.5"
	>
		{publication.description}
	</p>
	<div style="margin:0 0 56px">
		<SubscribeForm maxWidth="440px" />
	</div>

	{#if posts.length === 0}
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
			{#each posts as post, i (post.slug)}
				<a
					href={resolve('/(public)/p/[slug]', { slug: post.slug })}
					style="display:block;padding:28px 0;text-decoration:none;color:inherit;{i <
					posts.length - 1
						? 'border-bottom:1px solid var(--color-divider)'
						: ''}"
				>
					<h3 style="font-size:22px;margin:0 0 6px;line-height:1.2;letter-spacing:-0.015em">
						{post.title}
					</h3>
					<div style="font-size:13px;color:var(--color-neutral-500);margin:0 0 8px">
						{formatPostDate(post.date)}
					</div>
					<p
						style="font-size:15px;color:var(--color-neutral-700);margin:0;line-height:1.55;max-width:580px"
					>
						{post.excerpt}
					</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
<div
	style="padding:32px 90px;border-top:2px solid var(--color-divider);font-size:13px;color:var(--color-neutral-500)"
>
	{publication.name} · Powered by OpenLetter
</div>
