<script lang="ts">
	import { resolve } from '$app/paths';
	import { publication } from '$lib/mock-data';

	let { current }: { current: 'dashboard' | 'analytics' | 'posts' | 'settings' } = $props();

	const tabs = [
		{ id: 'dashboard', label: 'Dashboard', href: resolve('/dashboard') },
		{ id: 'analytics', label: 'Analytics', href: resolve('/dashboard/analytics') },
		{ id: 'posts', label: 'Posts', href: resolve('/dashboard/posts') },
		{ id: 'settings', label: 'Settings', href: resolve('/dashboard/settings') }
	] as const;
</script>

<nav
	style="display:flex;align-items:center;gap:24px;padding:16px 40px;border-bottom:3px solid var(--color-accent)"
>
	<span
		style="font-family:var(--font-heading);font-weight:800;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent)"
	>
		OpenLetter
	</span>
	<div style="width:2px;height:18px;background:var(--color-divider);margin:0 4px"></div>
	<span
		style="font-family:var(--font-heading);font-weight:800;font-size:16px;color:var(--color-text);margin-right:auto;letter-spacing:-0.01em"
	>
		{publication.name}
	</span>
	{#each tabs as tab (tab.id)}
		<a
			href={tab.href}
			aria-current={tab.id === current ? 'page' : undefined}
			style="font-size:14px;text-decoration:none;{tab.id === current
				? 'color:var(--color-text);border-bottom:2px solid var(--color-text);padding-bottom:2px'
				: 'color:var(--color-neutral-500)'}"
		>
			{tab.label}
		</a>
	{/each}
	<a href={resolve('/')} style="font-size:14px;color:var(--color-neutral-500);text-decoration:none">
		View publication →
	</a>
</nav>
