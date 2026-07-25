<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
</script>

<nav style="border-bottom:3px solid var(--color-accent)">
	<div
		class="container"
		style="display:flex;align-items:center;padding:20px clamp(20px, 8vw, 90px)"
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
	</div>
</nav>
