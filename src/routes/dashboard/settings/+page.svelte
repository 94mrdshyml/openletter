<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { GOOGLE_FONTS, googleFontsHref } from '$lib/fonts';
	import { pickOnAccentColor } from '$lib/color';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const pub = $derived(data.publication);
	const apiKeys = $derived(data.apiKeys);

	let copied = $state(false);
	function copyKey(raw: string) {
		navigator.clipboard.writeText(raw);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	let accentColor = $state(pub?.accentColor ?? '#ec3013');
	let headingFont = $state(pub?.headingFont ?? 'Archivo');
	let bodyFont = $state(pub?.bodyFont ?? 'Archivo');
	const accentPreview = $derived(pickOnAccentColor(accentColor));
	// The root layout only loads whatever font is already saved — load the
	// currently-picked (possibly unsaved) fonts too, so the preview below
	// renders in the real typeface rather than a system-font fallback.
	const previewFontsHref = $derived(googleFontsHref([headingFont, bodyFont]));
</script>

<svelte:head>
	<title>Settings · {pub?.name ?? 'Settings'}</title>
	<link href={previewFontsHref} rel="stylesheet" />
</svelte:head>

<div class="container-wide" style="padding:40px">
	<div style="max-width:520px">
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

			<div style="border-top:2px solid var(--color-divider);padding-top:24px">
				<h3 style="font-size:18px;margin:0 0 4px">Personalization</h3>
				<p style="font-size:13px;color:var(--color-neutral-500);margin:0 0 16px">
					Applies across your public site and dashboard.
				</p>
			</div>
			<div style="display:flex;gap:16px">
				<div class="field" style="flex:1">
					<label for="headingFont">Heading font</label>
					<select class="input" id="headingFont" name="headingFont" bind:value={headingFont}>
						{#each GOOGLE_FONTS as font (font)}
							<option value={font}>{font}</option>
						{/each}
					</select>
				</div>
				<div class="field" style="flex:1">
					<label for="bodyFont">Body font</label>
					<select class="input" id="bodyFont" name="bodyFont" bind:value={bodyFont}>
						{#each GOOGLE_FONTS as font (font)}
							<option value={font}>{font}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="field">
				<label for="accentColor">Brand color</label>
				<div style="display:flex;align-items:center;gap:12px">
					<input
						id="accentColor"
						name="accentColor"
						type="color"
						bind:value={accentColor}
						style="width:44px;height:36px;padding:2px;border:1px solid var(--color-divider);background:var(--color-surface);cursor:pointer"
					/>
					<span style="font-size:13px;color:var(--color-neutral-500)">{accentColor}</span>
				</div>
				{#if accentPreview.meetsAA}
					<p style="font-size:12px;color:var(--color-neutral-500);margin:8px 0 0">
						Button text contrast: {accentPreview.contrast.toFixed(1)}:1 — meets accessibility
						guidelines.
					</p>
				{:else}
					<p style="font-size:12px;color:var(--color-accent-700);margin:8px 0 0">
						Button text contrast is {accentPreview.contrast.toFixed(1)}:1, below the recommended
						4.5:1. Button text has switched to {accentPreview.color === '#201e1d'
							? 'dark'
							: 'light'} automatically for the best available contrast.
					</p>
				{/if}
			</div>
			<div class="field">
				<span
					style="display:block;font-size:12px;margin-bottom:5px;color:color-mix(in srgb, var(--color-text) 70%, transparent)"
					>Preview</span
				>
				<div
					style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--color-surface);border:1px solid var(--color-divider)"
				>
					<span
						style="font-family:'{headingFont}', system-ui, sans-serif;font-weight:800;font-size:20px;letter-spacing:-0.02em"
						>Aa</span
					>
					<button
						type="button"
						tabindex="-1"
						style="font-family:'{headingFont}', system-ui, sans-serif;font-weight:800;font-size:14px;padding:10px 24px;border:none;cursor:default;background:{accentColor};color:{accentPreview.color}"
					>
						New post
					</button>
					<span style="font-family:'{bodyFont}', system-ui, sans-serif;font-size:14px"
						>Body text sample</span
					>
				</div>
			</div>

			<div style="border-top:2px solid var(--color-divider);padding-top:24px">
				<h3 style="font-size:18px;margin:0 0 4px">Email delivery</h3>
				<p style="font-size:13px;color:var(--color-neutral-500);margin:0 0 16px">
					Powers sign-in links, admin invites, and the newsletter.
				</p>
				<p style="font-size:12px;color:var(--color-neutral-500);margin:0 0 16px;line-height:1.5">
					Open/click rates in Analytics need tracking turned on for your sending domain — off by
					default on Resend. In Resend: your domain → Configuration → "Enable tracking metrics"
					(needs a verified tracking subdomain).
				</p>
			</div>
			<div class="field">
				<label for="resendApiKey">Resend API key</label>
				<input
					class="input"
					id="resendApiKey"
					name="resendApiKey"
					type="password"
					placeholder={pub?.hasResendApiKey ? '••••••••••••••••' : 'Not set'}
				/>
				<p style="font-size:12px;color:var(--color-neutral-400);margin:6px 0 0">
					Leave blank to keep the current key.
				</p>
			</div>
			<div style="display:flex;gap:16px">
				<div class="field" style="flex:1">
					<label for="resendFromName">From name</label>
					<input
						class="input"
						id="resendFromName"
						name="resendFromName"
						value={pub?.resendFromName ?? ''}
					/>
				</div>
				<div class="field" style="flex:1">
					<label for="resendFromEmail">From email</label>
					<input
						class="input"
						id="resendFromEmail"
						name="resendFromEmail"
						type="email"
						value={pub?.resendFromEmail ?? ''}
					/>
				</div>
			</div>
			<div style="display:flex;gap:16px">
				<div class="field" style="flex:1">
					<label for="resendSegmentId">Resend Segment ID</label>
					<input
						class="input"
						id="resendSegmentId"
						name="resendSegmentId"
						value={pub?.resendSegmentId ?? ''}
						placeholder="Create a Segment in Resend, paste its id here"
					/>
				</div>
				<div class="field" style="flex:1">
					<label for="resendTopicId">Resend Topic ID</label>
					<input
						class="input"
						id="resendTopicId"
						name="resendTopicId"
						value={pub?.resendTopicId ?? ''}
						placeholder="Create a Topic in Resend, paste its id here"
					/>
				</div>
			</div>
			<div class="field">
				<label for="resendWebhookSecret">Resend webhook signing secret</label>
				<input
					class="input"
					id="resendWebhookSecret"
					name="resendWebhookSecret"
					type="password"
					placeholder={pub?.hasResendWebhookSecret ? '••••••••••••••••' : 'Not set'}
				/>
				<p style="font-size:12px;color:var(--color-neutral-400);margin:6px 0 0">
					In Resend, add a webhook pointed at <code>{'{your domain}'}/api/webhooks/resend</code>
					subscribed to <code>email.opened</code> and <code>email.clicked</code>, then paste its
					signing secret here — this is what makes open/click rates in Analytics real. Leave blank
					to keep the current secret.
				</p>
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

		<div style="border-top:2px solid var(--color-divider);margin-top:40px;padding-top:32px">
			<h3 style="font-size:18px;margin:0 0 4px">API keys</h3>
			<p style="font-size:13px;color:var(--color-neutral-500);margin:0 0 16px">
				Used to authenticate requests to the public API (subscribers, posts) — see
				<code>docs/API.md</code>. One key per integration; revoke instead of sharing.
			</p>

			{#if form?.createdKey}
				<div
					style="background:var(--color-surface);border:1px solid var(--color-divider);padding:16px;margin:0 0 16px"
				>
					<p style="font-size:13px;margin:0 0 8px">
						New key <strong>{form.createdKeyName}</strong> — copy it now, it won't be shown again:
					</p>
					<div style="display:flex;gap:8px">
						<input class="input" readonly value={form.createdKey} style="flex:1;font-size:13px" />
						<button
							type="button"
							class="btn btn-secondary"
							style="padding:10px 16px;min-height:42px;font-size:14px;white-space:nowrap"
							onclick={() => copyKey(form?.createdKey ?? '')}
						>
							{copied ? 'Copied' : 'Copy'}
						</button>
					</div>
				</div>
			{/if}
			{#if form?.keyError}
				<p style="font-size:14px;color:var(--color-accent-700);margin:0 0 16px">{form.keyError}</p>
			{/if}

			{#if apiKeys && apiKeys.length > 0}
				<div style="display:flex;flex-direction:column;gap:8px;margin:0 0 20px">
					{#each apiKeys as key (key.id)}
						<div
							style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-divider)"
						>
							<div>
								<span style="font-size:14px">{key.name}</span>
								<span style="font-size:13px;color:var(--color-neutral-500)">
									· ending in {key.lastFour}
									{#if key.revokedAt}
										· revoked
									{:else if key.lastUsedAt}
										· last used {new Date(key.lastUsedAt).toLocaleDateString()}
									{:else}
										· never used
									{/if}
								</span>
							</div>
							{#if !key.revokedAt}
								<form method="POST" action="?/revokeApiKey">
									<input type="hidden" name="id" value={key.id} />
									<button
										type="submit"
										class="btn btn-secondary"
										style="padding:6px 14px;min-height:0;font-size:13px"
									>
										Revoke
									</button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<form method="POST" action="?/createApiKey" style="display:flex;gap:8px">
				<input
					class="input"
					name="name"
					placeholder="e.g. Zapier integration"
					required
					style="flex:1;font-size:15px;padding:10px 14px;min-height:42px"
				/>
				<button
					type="submit"
					class="btn btn-secondary"
					style="padding:10px 20px;min-height:42px;font-size:14px;white-space:nowrap"
				>
					Create key
				</button>
			</form>
		</div>
	</div>
</div>
