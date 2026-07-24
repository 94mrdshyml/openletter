<script lang="ts">
	import { formatPostDate } from '$lib/format';
	import SubscribeForm from '$lib/components/SubscribeForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(data.publication?.name ?? 'OpenLetter');
	const description = $derived(data.publication?.description ?? '');
</script>

<svelte:head>
	<title>{data.post.title} · {name}</title>
</svelte:head>

<article style="padding:56px 90px 48px;max-width:860px">
	<div style="font-size:13px;color:var(--color-neutral-500);margin:0 0 16px;letter-spacing:0.02em">
		{formatPostDate(data.post.date)}
	</div>
	<h1 style="font-size:40px;line-height:1.08;margin:0 0 32px;letter-spacing:-0.025em">
		{data.post.title}
	</h1>
	<div style="font-size:17px;line-height:1.7;color:var(--color-text)">
		{#each data.post.body as paragraph (paragraph)}
			<p style="margin:0 0 20px">{paragraph}</p>
		{/each}
	</div>
</article>
<div style="padding:48px 90px;max-width:860px">
	<div style="border-top:2px solid var(--color-divider);padding:36px 0 0">
		<h4 style="font-size:18px;margin:0 0 8px">Read more from {name}</h4>
		<p style="font-size:15px;color:var(--color-neutral-600);margin:0 0 20px;line-height:1.5">
			{description}
		</p>
		<SubscribeForm maxWidth="400px" />
	</div>
</div>
<div
	style="padding:32px 90px;border-top:2px solid var(--color-divider);font-size:13px;color:var(--color-neutral-500)"
>
	{name} · Powered by OpenLetter
</div>
