<script lang="ts">
	import { page } from '$app/state';
	import { formatPostDateShort } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');

	function formatDateTime(date: Date): string {
		return `${formatPostDateShort(date.toISOString().slice(0, 10))}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
	}
</script>

<svelte:head>
	<title>Subscribers · {name}</title>
</svelte:head>

<div class="container-wide" style="padding:40px">
	<h2 style="font-size:28px;margin:0 0 24px;letter-spacing:-0.02em">
		Subscribers <span style="color:var(--color-neutral-500);font-weight:400"
			>({data.subscribers.length})</span
		>
	</h2>

	{#if data.subscribers.length === 0}
		<p style="font-size:14px;color:var(--color-neutral-500)">No subscribers yet.</p>
	{:else}
		<table class="table">
			<thead>
				<tr>
					<th style="width:30%">Email</th>
					<th>Subscribed</th>
					<th>Received</th>
					<th>Opened</th>
					<th>Clicked</th>
					<th>Unsubscribed</th>
				</tr>
			</thead>
			<tbody>
				{#each data.subscribers as row (row.id)}
					<tr>
						<td>{row.email}</td>
						<td>{formatPostDateShort(row.subscribedAt.toISOString().slice(0, 10))}</td>
						<td>{row.received}</td>
						<td>{row.opened}</td>
						<td>{row.clicked}</td>
						<td>
							{#if row.unsubscribedAt}
								<span class="tag tag-neutral">{formatDateTime(row.unsubscribedAt)}</span>
							{:else}
								<span style="color:var(--color-neutral-400)">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
