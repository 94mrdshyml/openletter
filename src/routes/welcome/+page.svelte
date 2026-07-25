<script lang="ts">
	import { page } from '$app/state';
	import PublicNav from '$lib/components/PublicNav.svelte';
	import SubscribeForm from '$lib/components/SubscribeForm.svelte';

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
	const tagline = $derived(page.data.publication?.tagline ?? '');
	const logoUrl = $derived(page.data.publication?.logoUrl ?? '');
	const readerEmail = $derived(page.data.readerEmail ?? '');
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<PublicNav />
<div class="container" style="padding:56px clamp(20px, 8vw, 90px) 48px">
	{#if logoUrl}
		<img src={logoUrl} alt="" style="width:64px;height:64px;object-fit:cover;margin:0 0 20px" />
	{/if}
	<h1 style="font-size:48px;line-height:1.05;margin:0 0 12px;letter-spacing:-0.025em">
		{name}
	</h1>
	{#if tagline}
		<p
			style="font-size:17px;color:var(--color-neutral-600);margin:0 0 36px;max-width:420px;line-height:1.5"
		>
			{tagline}
		</p>
	{/if}
	<SubscribeForm maxWidth="440px" email={readerEmail} />
</div>
<div style="border-top:2px solid var(--color-divider)">
	<div
		class="container"
		style="padding:32px clamp(20px, 8vw, 90px);font-size:13px;color:var(--color-neutral-500)"
	>
		{name} · Powered by OpenLetter
	</div>
</div>
