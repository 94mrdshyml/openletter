<script lang="ts">
	import { page } from '$app/state';
	import PostEditorPage from '$lib/components/PostEditorPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const publicationName = $derived(page.data.publication?.name ?? 'OpenLetter');
</script>

<PostEditorPage post={data.post} {publicationName} subscriberCount={data.subscriberCount} />
