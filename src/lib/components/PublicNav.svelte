<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
</script>

<nav
	style="display:flex;align-items:center;padding:20px 90px;border-bottom:3px solid var(--color-accent)"
>
	<a
		href={resolve('/')}
		style="font-family:var(--font-heading);font-weight:800;font-size:18px;margin-right:auto;color:var(--color-text);letter-spacing:-0.01em;text-decoration:none"
	>
		{name}
	</a>
	<a
		href={resolve('/')}
		style="font-size:14px;color:var(--color-text);text-decoration:none;font-family:var(--font-body)"
	>
		Subscribe
	</a>
</nav>
