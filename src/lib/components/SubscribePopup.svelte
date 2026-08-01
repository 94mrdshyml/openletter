<script lang="ts">
	import { onMount } from 'svelte';
	import SubscribeForm from './SubscribeForm.svelte';

	let { name }: { name: string } = $props();

	let visible = $state(false);
	let dismissed = $state(false);

	onMount(() => {
		function onScroll() {
			if (dismissed || visible) return;
			const scrollable = document.documentElement.scrollHeight - window.innerHeight;
			const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
			if (percent >= 45) visible = true;
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function dismiss() {
		visible = false;
		dismissed = true;
	}
</script>

{#if visible}
	<div class="dialog-backdrop">
		<div class="dialog" style="text-align:center">
			<button
				class="btn btn-ghost btn-icon"
				style="align-self:flex-end;margin:-4px -4px 0 0"
				onclick={dismiss}
				aria-label="Close"
			>
				✕
			</button>
			<div class="dialog-title">Enjoying this post?</div>
			<p class="dialog-body">
				Subscribe to {name} and get new posts delivered straight to your inbox.
			</p>
			<div style="display:flex;justify-content:center">
				<SubscribeForm maxWidth="360px" />
			</div>
		</div>
	</div>
{/if}
