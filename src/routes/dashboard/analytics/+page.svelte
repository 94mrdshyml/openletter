<script lang="ts">
	import { publication, postPerformance, subscriberGrowth } from '$lib/mock-data';

	const monthLabels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
	const maxGrowth = Math.max(...subscriberGrowth);
</script>

<svelte:head>
	<title>Analytics · {publication.name}</title>
</svelte:head>

<div style="padding:40px">
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
				{publication.subscriberCount}
			</div>
			<div style="font-size:12px;color:var(--color-accent);margin-top:6px">
				+{publication.analytics.newThisWeek} this week
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
				{publication.analytics.avgOpenRate}%
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">Last 30 days</div>
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
				{publication.analytics.postsPublished}
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">Since Feb 2026</div>
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
				{publication.analytics.avgClickRate}%
			</div>
			<div style="font-size:12px;color:var(--color-neutral-500);margin-top:6px">Last 30 days</div>
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
				{#each subscriberGrowth as value, i (i)}
					<div
						style="flex:1;background:{i === subscriberGrowth.length - 1
							? 'var(--color-accent)'
							: 'var(--color-neutral-200)'};height:{(value / maxGrowth) * 100}%"
					></div>
				{/each}
			</div>
			<div
				style="position:absolute;bottom:0;left:24px;right:24px;display:flex;justify-content:space-between;font-size:10px;color:var(--color-neutral-400);letter-spacing:0.04em"
			>
				{#each monthLabels as label (label)}
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
			{#each postPerformance as row (row.title)}
				<tr>
					<td style="font-family:var(--font-heading);font-weight:800;font-size:14px">{row.title}</td
					>
					<td>{row.date}</td>
					<td>{row.opened}</td>
					<td>{row.openRate}%</td>
					<td>{row.clicks}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
