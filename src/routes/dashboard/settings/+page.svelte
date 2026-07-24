<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const pub = $derived(data.publication);
</script>

<svelte:head>
	<title>Settings · {pub?.name ?? 'Settings'}</title>
</svelte:head>

<div style="padding:40px;max-width:520px">
	<h2 style="font-size:28px;margin:0 0 32px;letter-spacing:-0.02em">Settings</h2>

	{#if form?.saved}
		<p style="font-size:14px;color:var(--color-accent);margin:0 0 20px">Saved.</p>
	{/if}

	<form
		method="POST"
		action="?/save"
		enctype="multipart/form-data"
		style="display:flex;flex-direction:column;gap:24px"
	>
		<div class="field">
			<label for="pub-name">Publication name</label>
			<input class="input" id="pub-name" name="name" value={pub?.name ?? ''} required />
		</div>
		<div class="field">
			<label for="pub-tagline">Tagline</label>
			<input class="input" id="pub-tagline" name="tagline" value={pub?.tagline ?? ''} />
		</div>
		<div class="field">
			<label for="pub-description">Description</label>
			<textarea class="input" id="pub-description" name="description" rows="2"
				>{pub?.description ?? ''}</textarea
			>
		</div>
		<div class="field">
			<label for="pub-category">Category</label>
			<input
				class="input"
				id="pub-category"
				name="category"
				value={pub?.category ?? ''}
				placeholder="Politics, Tech, Fiction…"
			/>
		</div>
		<div class="field">
			<label for="pub-logo">Publication logo</label>
			<div style="display:flex;align-items:center;gap:16px">
				<div
					style="width:64px;height:64px;background:var(--color-surface);border:2px dashed var(--color-divider);display:grid;place-items:center;overflow:hidden"
				>
					{#if pub?.logoUrl}
						<img src={pub.logoUrl} alt="" style="width:100%;height:100%;object-fit:cover" />
					{:else}
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
					{/if}
				</div>
				<div>
					<input class="input" id="pub-logo" name="logo" type="file" accept="image/*" />
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

	<div style="border-top:2px solid var(--color-divider);margin-top:40px;padding-top:32px">
		<h3 style="font-size:18px;margin:0 0 8px">Invite an admin</h3>
		<p style="font-size:13px;color:var(--color-neutral-500);margin:0 0 16px">
			Subsequent admins can only be added by invitation.
		</p>
		{#if form?.invited}
			<p style="font-size:14px;color:var(--color-accent);margin:0 0 16px">Invitation sent.</p>
		{/if}
		<form method="POST" action="?/invite" style="display:flex;gap:8px">
			<input
				class="input"
				type="email"
				name="email"
				placeholder="colleague@example.com"
				required
				style="flex:1;font-size:15px;padding:10px 14px;min-height:42px"
			/>
			<button
				type="submit"
				class="btn btn-secondary"
				style="padding:10px 20px;min-height:42px;font-size:14px;white-space:nowrap"
			>
				Send invite
			</button>
		</form>
	</div>
</div>
