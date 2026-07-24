<script lang="ts">
	import { page } from '$app/state';
	import SubscribeForm from '$lib/components/SubscribeForm.svelte';

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
	const tagline = $derived(page.data.publication?.tagline ?? '');
	const logoUrl = $derived(page.data.publication?.logoUrl ?? '');
	const readerEmail = $derived(page.data.readerEmail ?? '');
</script>

<svelte:head>
	<title>{name}</title>
</svelte:head>

<div style="min-height:100vh;display:flex;flex-direction:column">
	<div style="height:3px;background:var(--color-accent)"></div>
	<div
		style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 90px;text-align:center"
	>
		{#if logoUrl}
			<img src={logoUrl} alt="" style="width:72px;height:72px;object-fit:cover;margin:0 0 24px" />
		{/if}
		<h1 style="font-size:42px;line-height:1.08;margin:0 0 12px;letter-spacing:-0.025em">
			{name}
		</h1>
		{#if tagline}
			<p
				style="font-size:17px;color:var(--color-neutral-600);margin:0 0 40px;line-height:1.6;max-width:480px"
			>
				{tagline}
			</p>
		{/if}
		<SubscribeForm maxWidth="440px" email={readerEmail} />
	</div>
</div>
