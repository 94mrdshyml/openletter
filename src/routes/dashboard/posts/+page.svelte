<script lang="ts">
	import { resolve } from '$app/paths';
	import { publication, posts, draftPosts } from '$lib/mock-data';
	import { formatPostDateShort } from '$lib/format';
	import DraftIcon from '$lib/components/icons/DraftIcon.svelte';
	import PublishedIcon from '$lib/components/icons/PublishedIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import MoreIcon from '$lib/components/icons/MoreIcon.svelte';
</script>

<svelte:head>
	<title>Posts · {publication.name}</title>
</svelte:head>

<div style="padding:40px;max-width:860px">
	<div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 32px">
		<h2 style="font-size:28px;margin:0;letter-spacing:-0.02em">Posts</h2>
		<a
			href={resolve('/dashboard/posts/new')}
			class="btn btn-primary"
			style="padding:10px 24px;font-size:14px;min-height:42px;gap:8px"
		>
			<PlusIcon />
			New post
		</a>
	</div>

	{#if draftPosts.length > 0}
		<h6
			style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
		>
			Drafts
		</h6>
		<div style="border-top:2px solid var(--color-divider);margin:0 0 32px">
			{#each draftPosts as draft (draft.slug)}
				<div
					style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--color-divider)"
				>
					<DraftIcon />
					<span style="font-family:var(--font-heading);font-weight:800;font-size:15px;flex:1"
						>{draft.title}</span
					>
					<span style="font-size:12px;color:var(--color-neutral-500)"
						>Edited {draft.editedRelative}</span
					>
					<a
						href={resolve('/dashboard/posts/new')}
						style="font-size:12px;color:var(--color-accent);text-decoration:none;font-family:var(--font-heading);font-weight:800"
						>Edit</a
					>
					<button
						class="btn btn-icon"
						style="width:28px;height:28px;color:var(--color-neutral-400)"
						title="More options"
					>
						<MoreIcon />
					</button>
				</div>
			{/each}
		</div>
	{/if}

	<h6
		style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
	>
		Published
	</h6>
	<div style="border-top:2px solid var(--color-divider)">
		{#each posts as post (post.slug)}
			<div
				style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--color-divider)"
			>
				<PublishedIcon />
				<span style="font-family:var(--font-heading);font-weight:800;font-size:15px;flex:1"
					>{post.title}</span
				>
				<span class="tag tag-neutral" style="font-size:10px">{post.openRate}% opened</span>
				<span style="font-size:12px;color:var(--color-neutral-500)"
					>{formatPostDateShort(post.date)}</span
				>
				<a
					href={resolve('/dashboard/posts/new')}
					style="font-size:12px;color:var(--color-accent);text-decoration:none;font-family:var(--font-heading);font-weight:800"
					>Edit</a
				>
				<button
					class="btn btn-icon"
					style="width:28px;height:28px;color:var(--color-neutral-400)"
					title="More options"
				>
					<MoreIcon />
				</button>
			</div>
		{/each}
	</div>
</div>
