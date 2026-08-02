<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Unsubscribe · {data.publication?.name ?? 'OpenLetter'}</title>
</svelte:head>

<div style="min-height:100vh;display:flex;flex-direction:column">
	<div style="height:3px;background:var(--color-accent)"></div>
	<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px">
		<div style="width:min(480px, 100%);padding:60px 48px">
			<div
				style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent);margin:0 0 24px;font-family:var(--font-heading);font-weight:800"
			>
				{data.publication?.name ?? 'OpenLetter'}
			</div>

			{#if form?.success}
				<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">You're unsubscribed</h2>
				<p style="font-size:14px;color:var(--color-neutral-600);line-height:1.5">
					{data.email} won't receive future newsletter emails from {data.publication?.name ??
						'this publication'}.
				</p>
			{:else if form && !form.success}
				<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">Something went wrong</h2>
				<p style="font-size:14px;color:var(--color-neutral-600);line-height:1.5">
					We couldn't process your unsubscribe request.
					{#if form.contactEmail}
						Contact <a href="mailto:{form.contactEmail}">{form.contactEmail}</a> directly and we'll remove
						you manually.
					{/if}
				</p>
			{:else if data.email}
				<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">Unsubscribe?</h2>
				<p style="font-size:14px;color:var(--color-neutral-600);margin:0 0 28px;line-height:1.5">
					<strong style="color:var(--color-text)">{data.email}</strong> will stop receiving
					newsletter emails from {data.publication?.name ?? 'this publication'}.
				</p>
				<form method="POST">
					<button
						type="submit"
						class="btn btn-primary btn-block"
						style="padding:10px 20px;min-height:42px;font-size:14px"
					>
						Confirm unsubscribe
					</button>
				</form>
			{:else}
				<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">Missing email</h2>
				<p style="font-size:14px;color:var(--color-neutral-600);line-height:1.5">
					This unsubscribe link is missing an email address.
				</p>
			{/if}
		</div>
	</div>
</div>
