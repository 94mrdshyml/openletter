<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { publication, draftPosts } from '$lib/mock-data';
	import BackIcon from '$lib/components/icons/BackIcon.svelte';
	import BoldIcon from '$lib/components/icons/BoldIcon.svelte';
	import ItalicIcon from '$lib/components/icons/ItalicIcon.svelte';
	import LinkIcon from '$lib/components/icons/LinkIcon.svelte';
	import HeadingIcon from '$lib/components/icons/HeadingIcon.svelte';
	import ImageIcon from '$lib/components/icons/ImageIcon.svelte';
	import BlockquoteIcon from '$lib/components/icons/BlockquoteIcon.svelte';

	let showPublishDialog = $state(false);

	function confirmPublish() {
		showPublishDialog = false;
		goto(resolve('/dashboard/posts'));
	}

	const toolbarButtons = [
		{ label: 'Bold', icon: BoldIcon },
		{ label: 'Italic', icon: ItalicIcon },
		{ label: 'Link', icon: LinkIcon },
		{ label: 'Heading', icon: HeadingIcon },
		{ label: 'Image', icon: ImageIcon },
		{ label: 'Block quote', icon: BlockquoteIcon }
	];
</script>

<svelte:head>
	<title>New post · {publication.name}</title>
</svelte:head>

<div style="background:var(--color-bg);min-height:700px;position:relative">
	<nav
		style="display:flex;align-items:center;gap:16px;padding:12px 40px;border-bottom:3px solid var(--color-accent)"
	>
		<a
			href={resolve('/dashboard')}
			style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--color-neutral-500);text-decoration:none;margin-right:auto"
		>
			<BackIcon />
			Dashboard
		</a>
		<span style="font-size:12px;color:var(--color-neutral-400)">Draft saved</span>
		<button
			type="button"
			class="btn btn-secondary"
			style="padding:8px 16px;font-size:13px;min-height:36px">Save draft</button
		>
		<button
			type="button"
			class="btn btn-primary"
			style="padding:8px 16px;font-size:13px;min-height:36px"
			onclick={() => (showPublishDialog = true)}
		>
			Publish
		</button>
	</nav>

	<div style="padding:48px 40px;max-width:680px;margin:0 auto">
		<div
			style="display:flex;gap:2px;padding:0 0 16px;border-bottom:1px solid var(--color-divider);margin:0 0 32px"
		>
			{#each toolbarButtons as tool (tool.label)}
				<button
					type="button"
					class="btn btn-icon"
					style="width:32px;height:32px;color:var(--color-neutral-600)"
					title={tool.label}
					aria-label={tool.label}
				>
					<tool.icon />
				</button>
			{/each}
		</div>

		<div
			contenteditable="true"
			role="textbox"
			aria-label="Post title"
			style="font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1.1;letter-spacing:-0.025em;color:var(--color-text);outline:none;margin:0 0 24px;min-height:44px"
		>
			{draftPosts[0].title}
		</div>
		<div
			contenteditable="true"
			role="textbox"
			aria-label="Post body"
			style="font-size:17px;line-height:1.7;color:var(--color-text);outline:none;min-height:300px"
		>
			{#each draftPosts[0].body as paragraph, i (i)}
				{#if i === draftPosts[0].body.length - 1}
					<p style="margin:0;color:var(--color-neutral-400);font-style:italic">{paragraph}</p>
				{:else}
					<p style="margin:0 0 20px">{paragraph}</p>
				{/if}
			{/each}
		</div>
	</div>

	{#if showPublishDialog}
		<div class="dialog-backdrop">
			<div class="dialog">
				<h3 class="dialog-title">Publish this post?</h3>
				<p class="dialog-body">
					"{draftPosts[0].title}" will be published to your site and emailed to
					<strong style="color:var(--color-text)">{publication.subscriberCount} subscribers</strong> immediately.
				</p>
				<p style="font-size:13px;color:var(--color-neutral-500);margin:0">
					This action sends an email to every subscriber. It cannot be unsent.
				</p>
				<div class="dialog-actions">
					<button
						type="button"
						class="btn btn-secondary"
						style="padding:8px 20px;font-size:13px;min-height:36px"
						onclick={() => (showPublishDialog = false)}
					>
						Keep editing
					</button>
					<button
						type="button"
						class="btn btn-primary"
						style="padding:8px 20px;font-size:13px;min-height:36px"
						onclick={confirmPublish}
					>
						Publish now
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
