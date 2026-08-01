<script lang="ts">
	import { page } from '$app/state';
	import { formatPostDateShort } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
	const maxGrowth = $derived(Math.max(1, ...data.subscriberGrowth));
</script>

<svelte:head>
	<title>Analytics · {name}</title>
</svelte:head>

<div class="container-wide" style="padding:40px">
	<div
		style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:2px solid var(--color-divider);margin:0 0 40px"
	>
		<div style="padding:24px;border-right:1px solid var(--color-divider)">
			<div
				style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 8px"
			>
				Total subscribers
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1;letter-spacing:-0.03em"
			>
				{data.subscriberCount}
			</div>
			<div style="font-size:12px;color:var(--color-accent);margin-top:6px">
				+{data.newThisWeek} this week
			</div>
		</div>
		<div style="padding:24px;border-right:1px solid var(--color-divider)">
			<div
				style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 8px"
			>
				Avg. open rate
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1;letter-spacing:-0.03em"
			>
				{data.avgOpenRate}%
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">
				Across {data.postPerformance.length} sent post{data.postPerformance.length === 1 ? '' : 's'}
			</div>
		</div>
		<div style="padding:24px;border-right:1px solid var(--color-divider)">
			<div
				style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 8px"
			>
				Posts published
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1;letter-spacing:-0.03em"
			>
				{data.postsPublished}
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">All time</div>
		</div>
		<div style="padding:24px">
			<div
				style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 8px"
			>
				Avg. click rate
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1;letter-spacing:-0.03em"
			>
				{data.avgClickRate}%
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">
				Across {data.postPerformance.length} sent post{data.postPerformance.length === 1 ? '' : 's'}
			</div>
		</div>
	</div>

	<div style="margin:0 0 40px">
		<h6
			style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 16px"
		>
			Subscriber growth
		</h6>
		<div
			style="border:2px solid var(--color-divider);padding:24px;height:200px;position:relative;overflow:hidden"
		>
			<div style="display:flex;align-items:flex-end;gap:4px;height:100%;padding-bottom:24px">
				{#each data.subscriberGrowth as value, i (i)}
					<div
						style="flex:1;background:{i === data.subscriberGrowth.length - 1
							? 'var(--color-accent)'
							: 'var(--color-neutral-200)'};height:{(value / maxGrowth) * 100}%"
					></div>
				{/each}
			</div>
			<div
				style="position:absolute;bottom:0;left:24px;right:24px;display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-400);letter-spacing:0.04em"
			>
				{#each data.monthLabels as label, i (i)}
					<span>{label}</span>
				{/each}
			</div>
		</div>
	</div>

	<h6
		style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
	>
		Post performance
	</h6>
	{#if data.postPerformance.length === 0}
		<p style="font-size:14px;color:var(--color-neutral-500)">
			No posts sent yet. Publishing a post emails your subscribers and its stats will show up here.
		</p>
	{:else}
		<table class="table">
			<thead>
				<tr>
					<th style="width:45%">Post</th>
					<th>Sent</th>
					<th>Opened</th>
					<th>Open rate</th>
					<th>Clicks</th>
				</tr>
			</thead>
			<tbody>
				{#each data.postPerformance as row (row.title)}
					<tr>
						<td style="font-family:var(--font-heading);font-weight:800;font-size:14px"
							>{row.title}</td
						>
						<td>{formatPostDateShort(row.publishedAt.toISOString().slice(0, 10))}</td>
						<td>{row.opened}</td>
						<td>{row.openRate}%</td>
						<td>{row.clicks}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
