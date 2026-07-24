<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import SettingsIcon from '$lib/components/icons/SettingsIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';

	const name = $derived(page.data.publication?.name ?? 'Your publication');
	const slug = $derived(page.data.publication?.slug ?? '');
</script>

<svelte:head>
	<title>Your publication is live · {name}</title>
</svelte:head>

<div style="min-height:100vh;display:flex;flex-direction:column">
	<div style="height:3px;background:var(--color-accent)"></div>
	<div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 90px">
		<div
			style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent);margin:0 0 16px;font-family:var(--font-heading);font-weight:800"
		>
			OpenLetter
		</div>
		<h1 style="font-size:42px;line-height:1.08;margin:0 0 16px;letter-spacing:-0.025em">
			Your publication is live
		</h1>
		<p
			style="font-size:17px;color:var(--color-neutral-600);margin:0 0 40px;line-height:1.6;max-width:480px"
		>
			{name} is deployed and running on your Cloudflare account. No servers to manage, no platform taking
			a cut — it's yours.
		</p>
		<div
			style="border-top:2px solid var(--color-divider);padding:24px 0 0;display:flex;flex-direction:column;gap:12px;max-width:400px"
		>
			<div
				style="font-size:13px;color:var(--color-neutral-600);margin:0 0 4px;font-family:var(--font-heading);font-weight:800"
			>
				Next steps
			</div>
			<a
				href={resolve('/dashboard/settings')}
				style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);text-decoration:none;color:inherit;border:1px solid var(--color-divider)"
			>
				<SettingsIcon />
				<div>
					<div style="font-family:var(--font-heading);font-weight:800;font-size:14px">
						Configure your publication
					</div>
					<div style="font-size:12px;color:var(--color-neutral-500)">
						Name, description, and logo
					</div>
				</div>
			</a>
			<a
				href={resolve('/dashboard/posts/new')}
				style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--color-surface);text-decoration:none;color:inherit;border:1px solid var(--color-divider)"
			>
				<span style="color:var(--color-accent);display:flex"><PlusIcon /></span>
				<div>
					<div style="font-family:var(--font-heading);font-weight:800;font-size:14px">
						Write your first post
					</div>
					<div style="font-size:12px;color:var(--color-neutral-500)">
						Publish and send to subscribers
					</div>
				</div>
			</a>
		</div>
	</div>
	<div style="padding:20px 90px;font-size:12px;color:var(--color-neutral-400)">
		{slug} · Deployed on Cloudflare
	</div>
</div>
