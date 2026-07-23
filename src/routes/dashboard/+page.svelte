<script lang="ts">
	import { resolve } from '$app/paths';
	import { publication, posts, draftPosts } from '$lib/mock-data';
	import { formatPostDateShort } from '$lib/format';
	import DraftIcon from '$lib/components/icons/DraftIcon.svelte';
	import PublishedIcon from '$lib/components/icons/PublishedIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
</script>

<svelte:head>
	<title>Dashboard · {publication.name}</title>
</svelte:head>

<div style="padding:40px 40px 48px;max-width:780px">
	<div style="display:flex;align-items:flex-end;justify-content:space-between;margin:0 0 40px">
		<div>
			<div
				style="font-size:13px;color:var(--color-neutral-500);margin:0 0 4px;letter-spacing:0.02em"
			>
				Subscribers
			</div>
			<div
				style="font-family:var(--font-heading);font-weight:800;font-size:48px;line-height:1;letter-spacing:-0.03em;color:var(--color-text)"
			>
				{publication.subscriberCount}
			</div>
		</div>
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
		<div style="margin:0 0 32px">
			<h6
				style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
			>
				Drafts
			</h6>
			<div style="border-top:2px solid var(--color-divider)">
				{#each draftPosts as draft (draft.slug)}
					<a
						href={resolve('/dashboard/posts/new')}
						style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--color-divider);text-decoration:none;color:inherit"
					>
						<DraftIcon />
						<span style="font-family:var(--font-heading);font-weight:800;font-size:15px;flex:1"
							>{draft.title}</span
						>
						<span style="font-size:12px;color:var(--color-neutral-500)"
							>Edited {draft.editedRelative}</span
						>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<div>
		<h6
			style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 12px"
		>
			Published
		</h6>
		<div style="border-top:2px solid var(--color-divider)">
			{#each posts as post, i (post.slug)}
				<a
					href={resolve('/(public)/p/[slug]', { slug: post.slug })}
					style="display:flex;align-items:center;gap:12px;padding:14px 0;text-decoration:none;color:inherit;{i <
					posts.length - 1
						? 'border-bottom:1px solid var(--color-divider)'
						: ''}"
				>
					<PublishedIcon />
					<span style="font-family:var(--font-heading);font-weight:800;font-size:15px;flex:1"
						>{post.title}</span
					>
					<span style="font-size:12px;color:var(--color-neutral-500)"
						>{formatPostDateShort(post.date)}</span
					>
				</a>
			{/each}
		</div>
	</div>
</div>
