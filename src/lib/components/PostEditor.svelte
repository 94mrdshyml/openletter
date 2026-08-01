<script lang="ts">
	import TiptapEditor from './TiptapEditor.svelte';
	import { slugify } from '$lib/slug';

	let {
		title = $bindable(''),
		subtitle = $bindable(''),
		slug = $bindable(''),
		excerpt = $bindable(''),
		body = $bindable(''),
		wall = $bindable<'public' | 'subscribers'>('public'),
		coverImageUrl = $bindable<string | null>(null)
	}: {
		title?: string;
		subtitle?: string;
		slug?: string;
		excerpt?: string;
		body?: string;
		wall?: 'public' | 'subscribers';
		coverImageUrl?: string | null;
	} = $props();

	// Slug auto-derives from the title until the writer edits it directly —
	// same pattern as the publication slug in dashboard/settings.
	let slugTouched = $state(slug.length > 0);
	let coverImageFile: File | null = $state(null);

	function onTitleInput(value: string) {
		title = value;
		if (!slugTouched) slug = slugify(value);
	}

	function onSlugInput(value: string) {
		slugTouched = true;
		slug = value;
	}

	let coverPreview = $derived(coverImageFile ? URL.createObjectURL(coverImageFile) : coverImageUrl);

	function onCoverPick(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) coverImageFile = file;
	}

	async function onImagePick(): Promise<string | null> {
		return new Promise((resolve) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.onchange = async () => {
				const file = input.files?.[0];
				if (!file) return resolve(null);
				const data = new FormData();
				data.set('image', file);
				const res = await fetch('/dashboard/posts/upload-image', { method: 'POST', body: data });
				if (!res.ok) return resolve(null);
				const { url } = (await res.json()) as { url: string };
				resolve(url);
			};
			input.click();
		});
	}
</script>

<div class="editor-layout">
	<div class="editor-main">
		<div class="field">
			<label for="cover-image">Cover image (optional)</label>
			<div style="display:flex;align-items:center;gap:16px">
				<div
					style="width:120px;height:63px;background:var(--color-surface);border:2px dashed var(--color-divider);display:grid;place-items:center;overflow:hidden;flex-shrink:0"
				>
					{#if coverPreview}
						<img src={coverPreview} alt="" style="width:100%;height:100%;object-fit:cover" />
					{:else}
						<span style="font-size:11px;color:var(--color-neutral-400)">1200×630</span>
					{/if}
				</div>
				<input
					class="input"
					id="cover-image"
					name="coverImage"
					type="file"
					accept="image/*"
					onchange={onCoverPick}
				/>
			</div>
		</div>

		<input
			name="title"
			value={title}
			oninput={(e) => onTitleInput(e.currentTarget.value)}
			placeholder="Title"
			aria-label="Post title"
			style="width:100%;border:none;background:transparent;font-family:var(--font-heading);font-weight:800;font-size:36px;line-height:1.1;letter-spacing:-0.025em;color:var(--color-text);outline:none;margin:24px 0 12px;padding:0"
		/>
		<input
			name="subtitle"
			value={subtitle}
			oninput={(e) => (subtitle = e.currentTarget.value)}
			placeholder="Subtitle (optional)"
			aria-label="Post subtitle"
			style="width:100%;border:none;background:transparent;font-size:19px;color:var(--color-neutral-600);outline:none;margin:0 0 24px;padding:0"
		/>

		<TiptapEditor content={body} onChange={(html) => (body = html)} {onImagePick} />
	</div>

	<aside class="editor-sidebar">
		<h3 style="font-size:16px;margin:0 0 16px">Post settings</h3>
		<div class="field">
			<label for="post-slug">Slug</label>
			<input
				class="input"
				id="post-slug"
				name="slug"
				value={slug}
				oninput={(e) => onSlugInput(e.currentTarget.value)}
			/>
		</div>
		<div class="field" style="margin-top:16px">
			<label for="post-excerpt">Excerpt</label>
			<textarea
				class="input"
				id="post-excerpt"
				name="excerpt"
				rows="3"
				value={excerpt}
				oninput={(e) => (excerpt = e.currentTarget.value)}
				placeholder="Shown in the post list and used as the SEO description. Defaults to the first line of the body if left blank."
			></textarea>
		</div>
		<div class="field" style="margin-top:16px">
			<label for="post-wall">Who can read the full post</label>
			<select
				class="input"
				id="post-wall"
				name="wall"
				value={wall}
				onchange={(e) => (wall = e.currentTarget.value as 'public' | 'subscribers')}
			>
				<option value="public">Everyone</option>
				<option value="subscribers">Subscribers only</option>
			</select>
		</div>
	</aside>
</div>

<!-- body/coverImageUrl aren't native form fields the writer types into
directly (body comes from Tiptap's onChange, coverImageUrl from the async
upload response), so they stay hidden inputs driven by Svelte state. Every
other field above submits its own live DOM value directly via `name` — not
a shadow hidden input relayed through Svelte state, which could go stale if
the writer types before hydration finishes attaching the input handlers. -->
<input type="hidden" name="body" value={body} />
<input type="hidden" name="coverImageUrl" value={coverImageUrl ?? ''} />

<style>
	.editor-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.85fr) minmax(280px, 1fr);
		gap: 48px;
		align-items: start;
	}
	.editor-sidebar {
		position: sticky;
		top: 88px;
		background: var(--color-surface);
		border: 1px solid var(--color-divider);
		padding: 20px;
	}
	@media (max-width: 860px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}
		.editor-sidebar {
			position: static;
		}
	}
</style>
