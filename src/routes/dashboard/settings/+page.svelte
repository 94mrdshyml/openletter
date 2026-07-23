<script lang="ts">
	import { publication } from '$lib/mock-data';

	function handleSave(e: SubmitEvent) {
		e.preventDefault();
	}
</script>

<svelte:head>
	<title>Settings · {publication.name}</title>
</svelte:head>

<div style="padding:40px;max-width:520px">
	<h2 style="font-size:28px;margin:0 0 32px;letter-spacing:-0.02em">Settings</h2>
	<form onsubmit={handleSave} style="display:flex;flex-direction:column;gap:24px">
		<div class="field">
			<label for="pub-name">Publication name</label>
			<input class="input" id="pub-name" value={publication.name} />
		</div>
		<div class="field">
			<label for="pub-slug">Slug</label>
			<div style="display:flex;align-items:center;gap:0">
				<span
					style="font-size:14px;color:var(--color-neutral-500);padding:8px 0 8px 10px;background:var(--color-surface);border:1px solid var(--color-divider);border-right:none;min-height:36px;display:flex;align-items:center;white-space:nowrap"
					>https://</span
				>
				<input class="input" id="pub-slug" value={publication.slug} style="border-left:none" />
			</div>
		</div>
		<div class="field">
			<label for="pub-description">Description</label>
			<textarea class="input" id="pub-description" rows="2">{publication.description}</textarea>
		</div>
		<div class="field">
			<label for="pub-logo">Publication logo</label>
			<div style="display:flex;align-items:center;gap:16px">
				<div
					style="width:64px;height:64px;background:var(--color-surface);border:2px dashed var(--color-divider);display:grid;place-items:center"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="var(--color-neutral-400)"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<rect width="18" height="18" x="3" y="3"></rect>
						<circle cx="9" cy="9" r="2"></circle>
						<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
					</svg>
				</div>
				<div>
					<button
						type="button"
						class="btn btn-secondary"
						style="padding:6px 14px;font-size:13px;min-height:32px"
						id="pub-logo">Upload logo</button
					>
					<p style="font-size:12px;color:var(--color-neutral-400);margin:6px 0 0">
						Optional. Your publication name is displayed if no logo is set.
					</p>
				</div>
			</div>
		</div>
		<div style="border-top:2px solid var(--color-divider);padding-top:24px;display:flex;gap:8px">
			<button
				type="submit"
				class="btn btn-primary"
				style="padding:10px 24px;font-size:14px;min-height:42px">Save changes</button
			>
		</div>
	</form>
</div>
