<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const displayName = $derived(
		[data.user.firstName, data.user.lastName].filter(Boolean).join(' ') ||
			data.user.name ||
			data.user.email
	);
	const avatarUrl = $derived(
		data.user.image || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`
	);
</script>

<svelte:head>
	<title>My profile</title>
</svelte:head>

<div style="min-height:100vh;display:flex;flex-direction:column">
	<div style="height:3px;background:var(--color-accent)"></div>
	<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px">
		<div style="width:min(480px, 100%);padding:60px 48px">
			<div
				style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent);margin:0 0 24px;font-family:var(--font-heading);font-weight:800"
			>
				OpenLetter
			</div>
			<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">My profile</h2>
			<p style="font-size:14px;color:var(--color-neutral-600);margin:0 0 28px;line-height:1.5">
				{data.user.email}
			</p>

			{#if form?.saved}
				<p style="font-size:14px;color:var(--color-accent);margin:0 0 20px">Saved.</p>
			{/if}

			<form
				method="POST"
				action="?/save"
				enctype="multipart/form-data"
				style="display:flex;flex-direction:column;gap:20px"
			>
				<div style="display:flex;align-items:center;gap:16px">
					<img
						src={avatarUrl}
						alt=""
						style="width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--color-surface)"
					/>
					<div>
						<input class="input" id="avatar" name="avatar" type="file" accept="image/*" />
						<p style="font-size:12px;color:var(--color-neutral-400);margin:6px 0 0">
							Optional. A picture is generated from your name if none is set.
						</p>
					</div>
				</div>
				<div class="field">
					<label for="firstName">First name</label>
					<input
						class="input"
						id="firstName"
						name="firstName"
						value={data.user.firstName ?? ''}
						style="font-size:15px;padding:10px 14px;min-height:42px"
					/>
				</div>
				<div class="field">
					<label for="lastName">Last name</label>
					<input
						class="input"
						id="lastName"
						name="lastName"
						value={data.user.lastName ?? ''}
						style="font-size:15px;padding:10px 14px;min-height:42px"
					/>
				</div>
				<button
					type="submit"
					class="btn btn-primary btn-block"
					style="padding:10px 20px;min-height:42px;font-size:14px"
				>
					Save changes
				</button>
			</form>

			<a
				href={resolve(data.user.role === 'admin' ? '/dashboard' : '/')}
				style="display:inline-block;margin-top:24px;font-size:14px;color:var(--color-neutral-500)"
			>
				← Back
			</a>
		</div>
	</div>
</div>
