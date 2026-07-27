<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AccountMenu from './AccountMenu.svelte';

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
	const user = $derived(page.data.user);
</script>

<nav style="border-bottom:3px solid var(--color-accent)">
	<div
		class="container"
		style="display:flex;align-items:center;gap:20px;padding:20px clamp(20px, 8vw, 90px);overflow-x:auto"
	>
		<a
			href={resolve('/')}
			style="font-family:var(--font-heading);font-weight:800;font-size:18px;margin-right:auto;color:var(--color-text);letter-spacing:-0.01em;text-decoration:none;white-space:nowrap"
		>
			{name}
		</a>
		{#if user}
			<AccountMenu role={user.role} context="public" />
		{:else}
			<a
				href={resolve('/login')}
				style="font-size:14px;color:var(--color-text);text-decoration:none;font-family:var(--font-body);white-space:nowrap"
			>
				Log in
			</a>
		{/if}
	</div>
</nav>
