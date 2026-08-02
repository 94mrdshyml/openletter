<script lang="ts">
	import { page } from '$app/state';
	import { formatPostDateShort } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
	const maxGrowth = $derived(Math.max(1, ...data.subscriberGrowth));

	let showSubscribers = $state(false);

	function avatarUrl(email: string): string {
		return `https://api.dicebear.com/10.x/pixel-art/svg?seed=${encodeURIComponent(email)}`;
	}
</script>

<svelte:head>
	<title>Analytics · {name}</title>
</svelte:head>

<div class="container-wide" style="padding:40px">
	<div
		style="display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:2px solid var(--color-divider);margin:0 0 40px"
	>
		<button
			type="button"
			class="subscriber-stat"
			style="padding:24px;border-right:1px solid var(--color-divider);text-align:left;background:none;border-top:0;border-left:0;border-bottom:0;cursor:pointer;font:inherit;color:inherit;width:100%"
			onclick={() => (showSubscribers = !showSubscribers)}
			aria-expanded={showSubscribers}
		>
			<div
				style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 8px"
			>
				Total subscribers {showSubscribers ? '▴' : '▾'}
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1;letter-spacing:-0.03em"
			>
				{data.subscriberCount}
			</div>
			<div style="font-size:12px;color:var(--color-accent);margin-top:6px">
				+{data.newThisWeek} this week
			</div>
		</button>
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
		<div style="padding:24px;border-right:1px solid var(--color-divider)">
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
		<div style="padding:24px">
			<div
				style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 8px"
			>
				Unsubscribed
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1;letter-spacing:-0.03em"
			>
				{data.unsubscribedCount}
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">All time</div>
		</div>
	</div>

	{#if showSubscribers}
		<div style="margin:0 0 40px">
			<h6
				style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
			>
				Subscribers
			</h6>
			{#if data.subscribers.length === 0}
				<p style="font-size:14px;color:var(--color-neutral-500)">No subscribers yet.</p>
			{:else}
				<div style="border-top:2px solid var(--color-divider)">
					{#each data.subscribers as row, i (row.id)}
						<div
							style="display:flex;align-items:center;gap:14px;padding:14px 0;{i <
							data.subscribers.length - 1
								? 'border-bottom:1px solid var(--color-divider)'
								: ''}"
						>
							<img
								src={avatarUrl(row.email)}
								alt=""
								style="width:32px;height:32px;object-fit:cover;background:var(--color-surface);flex-shrink:0"
							/>
							<span
								style="font-size:14px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
							>
								{row.email}
							</span>
							<span style="font-size:12px;color:var(--color-neutral-500);white-space:nowrap">
								Joined {formatPostDateShort(row.subscribedAt.toISOString().slice(0, 10))}
							</span>
							<span style="font-size:12px;color:var(--color-neutral-500);white-space:nowrap">
								{row.received} sent · {row.opened} opened · {row.clicked} clicked
							</span>
							{#if row.unsubscribedAt}
								<span class="tag tag-neutral" style="font-size:10px">Unsubscribed</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

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
					<th style="width:35%">Post</th>
					<th>Sent</th>
					<th>Delivered</th>
					<th>Opened</th>
					<th>Open rate</th>
					<th>Clicks</th>
					<th>Bounced</th>
					<th>Complained</th>
				</tr>
			</thead>
			<tbody>
				{#each data.postPerformance as row (row.title)}
					<tr>
						<td style="font-family:var(--font-heading);font-weight:800;font-size:14px"
							>{row.title}</td
						>
						<td>{formatPostDateShort(row.publishedAt.toISOString().slice(0, 10))}</td>
						<td>{row.delivered}</td>
						<td>{row.opened}</td>
						<td>{row.openRate}%</td>
						<td>{row.clicks}</td>
						<td>{row.bounced}</td>
						<td>{row.complained}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.subscriber-stat:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}
</style>
