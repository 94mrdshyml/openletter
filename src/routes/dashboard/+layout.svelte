<script lang="ts">
	import { page } from '$app/state';
	import AdminNav from '$lib/components/AdminNav.svelte';

	let { children } = $props();

	let current = $derived.by((): 'dashboard' | 'analytics' | 'posts' | 'settings' => {
		const path = page.url.pathname;
		if (path.startsWith('/dashboard/analytics')) return 'analytics';
		if (path.startsWith('/dashboard/posts')) return 'posts';
		if (path.startsWith('/dashboard/settings')) return 'settings';
		return 'dashboard';
	});
</script>

<AdminNav {current} />
{@render children()}
