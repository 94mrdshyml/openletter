<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { formatPostDate } from '$lib/format';
	import SubscribeForm from '$lib/components/SubscribeForm.svelte';
	import SubscribePopup from '$lib/components/SubscribePopup.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(data.publication?.name ?? 'OpenLetter');
	const description = $derived(data.publication?.description ?? '');
	const seoDescription = $derived(data.post.excerpt ?? data.post.subtitle ?? description);
	const isAnon = $derived(!page.data.user);

	// Twitter's oEmbed blockquote markup (see tweet-extension.ts) needs its
	// own widgets.js to actually render as a rich embed — only loaded when
	// the post body actually contains one, and only once per page.
	onMount(() => {
		if (!data.post.body?.includes('twitter-tweet')) return;
		if (document.querySelector('script[data-twitter-widgets]')) return;
		const script = document.createElement('script');
		script.src = 'https://platform.twitter.com/widgets.js';
		script.async = true;
		script.dataset.twitterWidgets = 'true';
		document.head.appendChild(script);
	});
</script>

<svelte:head>
	<title>{data.post.title} · {name}</title>
	<meta name="description" content={seoDescription} />
	<link rel="canonical" href={data.canonicalUrl} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={seoDescription} />
	{#if data.post.coverImageUrl}
		<meta property="og:image" content={data.post.coverImageUrl} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={seoDescription} />
</svelte:head>

{#if data.isPreview}
	<div
		style="background:var(--color-accent-100);color:var(--color-accent-800);text-align:center;padding:10px;font-size:13px;font-family:var(--font-heading);font-weight:800"
	>
		Preview — this post isn't published yet
	</div>
{/if}

<article class="container-narrow" style="padding:56px clamp(20px, 8vw, 90px) 48px">
	<div style="font-size:13px;color:var(--color-neutral-500);margin:0 0 16px;letter-spacing:0.02em">
		{data.post.publishedAt
			? formatPostDate(data.post.publishedAt.toISOString().slice(0, 10))
			: 'Draft'}
	</div>
	<h1 style="font-size:40px;line-height:1.08;margin:0 0 12px;letter-spacing:-0.025em">
		{data.post.title}
	</h1>
	{#if data.post.subtitle}
		<p style="font-size:19px;color:var(--color-neutral-600);margin:0 0 28px;line-height:1.5">
			{data.post.subtitle}
		</p>
	{/if}
	{#if data.post.coverImageUrl}
		<img
			src={data.post.coverImageUrl}
			alt=""
			class="bleed-image"
			style="aspect-ratio:1200/630;object-fit:cover;margin-top:0;margin-bottom:32px"
		/>
	{/if}
	{#if data.gated}
		<div style="font-size:17px;line-height:1.7;color:var(--color-text)">
			<p style="margin:0 0 20px">{data.post.excerpt}</p>
		</div>
		<div
			id="subscribe"
			style="border-top:2px solid var(--color-divider);padding:32px 0 0;margin-top:12px"
		>
			<h4 style="font-size:18px;margin:0 0 8px">Subscribe to keep reading</h4>
			<p style="font-size:15px;color:var(--color-neutral-600);margin:0 0 20px;line-height:1.5">
				This post is for subscribers only. Enter your email to get full access.
			</p>
			<SubscribeForm maxWidth="400px" />
		</div>
	{:else}
		<div class="post-body" style="font-size:17px;line-height:1.7;color:var(--color-text)">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted input: post.body is only ever written by the single authenticated admin via the Tiptap editor, never by reader/subscriber input -->
			{@html data.post.body}
		</div>
	{/if}
</article>
{#if !data.gated}
	<div class="container-narrow" style="padding:48px clamp(20px, 8vw, 90px)">
		<div id="subscribe" style="border-top:2px solid var(--color-divider);padding:36px 0 0">
			<h4 style="font-size:18px;margin:0 0 8px">Read more from {name}</h4>
			<p style="font-size:15px;color:var(--color-neutral-600);margin:0 0 20px;line-height:1.5">
				{description}
			</p>
			<SubscribeForm maxWidth="400px" />
		</div>
	</div>
{/if}
<div style="border-top:2px solid var(--color-divider)">
	<div
		class="container"
		style="padding:32px clamp(20px, 8vw, 90px);font-size:13px;color:var(--color-neutral-500)"
	>
		{name} · Powered by OpenLetter
	</div>
</div>
{#if isAnon && !data.gated}
	<SubscribePopup {name} />
{/if}

<style>
	/* Images bleed to the edge of the narrow article column instead of being
	   squeezed by the article's own inline horizontal padding — makes them
	   noticeably bigger than the text without widening the reading column
	   itself (680px was a deliberate choice for prose measure). */
	.bleed-image,
	.post-body :global(img) {
		display: block;
		width: calc(100% + 2 * clamp(20px, 8vw, 90px));
		max-width: none;
		margin-left: calc(-1 * clamp(20px, 8vw, 90px));
		margin-right: calc(-1 * clamp(20px, 8vw, 90px));
	}
	.post-body :global(p) {
		margin: 0 0 20px;
	}
	.post-body :global(blockquote) {
		border-left: 3px solid var(--color-accent);
		margin: 0 0 20px;
		padding-left: 16px;
		color: var(--color-neutral-700);
	}
	.post-body :global(iframe) {
		max-width: 100%;
		margin: 0 0 20px;
	}
</style>
