<script lang="ts">
	import PublicNav from '$lib/components/PublicNav.svelte';

	let { children } = $props();
</script>

<PublicNav />
{@render children()}
