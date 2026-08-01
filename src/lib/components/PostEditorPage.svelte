<script lang="ts">
	import { resolve } from '$app/paths';
	import PostEditor from './PostEditor.svelte';
	import BackIcon from './icons/BackIcon.svelte';

	let {
		post = null,
		publicationName,
		subscriberCount
	}: {
		post?: {
			title: string;
			subtitle: string | null;
			slug: string;
			excerpt: string | null;
			body: string;
			wall: 'public' | 'subscribers';
			coverImageUrl: string | null;
			status: 'draft' | 'published';
			publishedAt: Date | null;
		} | null;
		publicationName: string;
		subscriberCount: number;
	} = $props();

	let title = $state(post?.title ?? '');
	let subtitle = $state(post?.subtitle ?? '');
	let slug = $state(post?.slug ?? '');
	let excerpt = $state(post?.excerpt ?? '');
	let body = $state(post?.body ?? '');
	let wall = $state<'public' | 'subscribers'>(post?.wall ?? 'public');
	let coverImageUrl = $state(post?.coverImageUrl ?? null);

	let showPublishDialog = $state(false);
	let scheduleMode = $state(false);
	let scheduledAt = $state('');

	const isAlreadyPublished = post?.status === 'published';
	const previewHref = $derived(slug ? resolve('/(public)/p/[slug]', { slug }) : null);
</script>

<svelte:head>
	<title>{post ? `Edit · ${title || 'Untitled'}` : 'New post'} · {publicationName}</title>
</svelte:head>

<div style="background:var(--color-bg);min-height:700px;position:relative">
	<form method="POST" enctype="multipart/form-data">
		<nav
			style="border-bottom:3px solid var(--color-accent);position:sticky;top:0;z-index:20;background:var(--color-bg)"
		>
			<div
				class="container-wide"
				style="display:flex;align-items:center;gap:16px;padding:12px 40px;flex-wrap:wrap"
			>
				<a
					href={resolve('/dashboard/posts')}
					style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--color-neutral-500);text-decoration:none;margin-right:auto"
				>
					<BackIcon />
					Dashboard
				</a>
				{#if previewHref}
					<a
						href={previewHref}
						target="_blank"
						rel="noopener"
						style="font-size:13px;color:var(--color-neutral-500);text-decoration:none"
					>
						Preview →
					</a>
				{/if}
				<button
					type="submit"
					formaction="?/save"
					class="btn btn-secondary"
					style="padding:8px 16px;font-size:13px;min-height:36px"
				>
					Save draft
				</button>
				<button
					type="button"
					class="btn btn-primary"
					style="padding:8px 16px;font-size:13px;min-height:36px"
					onclick={() => (showPublishDialog = true)}
				>
					{isAlreadyPublished ? 'Update' : 'Publish'}
				</button>
			</div>
		</nav>

		<div class="container-wide" style="padding:48px 40px">
			<PostEditor
				bind:title
				bind:subtitle
				bind:slug
				bind:excerpt
				bind:body
				bind:wall
				bind:coverImageUrl
			/>
		</div>

		{#if showPublishDialog}
			<div class="dialog-backdrop">
				<div class="dialog">
					<h3 class="dialog-title">
						{isAlreadyPublished ? 'Update this post?' : 'Publish this post?'}
					</h3>
					{#if isAlreadyPublished}
						<p class="dialog-body">
							"{title || 'Untitled'}" is already live — this updates the published version. No new
							email is sent.
						</p>
					{:else}
						<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:0">
							<input type="checkbox" bind:checked={scheduleMode} />
							Schedule for later instead of publishing now
						</label>
						{#if scheduleMode}
							<div class="field">
								<label for="scheduled-at">Publish at</label>
								<input
									class="input"
									id="scheduled-at"
									type="datetime-local"
									bind:value={scheduledAt}
								/>
							</div>
						{/if}
						<p class="dialog-body">
							{#if scheduleMode && scheduledAt}
								This will go live and email
								<strong style="color:var(--color-text)">{subscriberCount} subscribers</strong>
								at the scheduled time.
							{:else}
								"{title || 'Untitled'}" will be published to your site and emailed to
								<strong style="color:var(--color-text)">{subscriberCount} subscribers</strong>
								immediately.
							{/if}
						</p>
						<p style="font-size:13px;color:var(--color-neutral-500);margin:0">
							This action sends an email to every subscriber. It cannot be unsent.
						</p>
					{/if}
					<input type="hidden" name="scheduledAt" value={scheduleMode ? scheduledAt : ''} />
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
							type="submit"
							formaction="?/publish"
							class="btn btn-primary"
							style="padding:8px 20px;font-size:13px;min-height:36px"
						>
							{isAlreadyPublished ? 'Update' : scheduleMode ? 'Schedule' : 'Publish now'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</form>
</div>
