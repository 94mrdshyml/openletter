<script lang="ts">
	import { enhance } from '$app/forms';

	let { maxWidth = '440px' }: { maxWidth?: string } = $props();
	let subscribed = $state(false);
</script>

{#if subscribed}
	<p style="max-width:{maxWidth};font-size:15px;color:var(--color-neutral-600)">
		Check your inbox to confirm your subscription.
	</p>
{:else}
	<form
		method="POST"
		action="/?/subscribe"
		style="display:flex;gap:0;max-width:{maxWidth}"
		data-testid="subscribe-form"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') subscribed = true;
			};
		}}
	>
		<input
			class="input"
			type="email"
			name="email"
			placeholder="your@email.com"
			required
			style="flex:1;border-right:none;font-size:15px;padding:10px 14px;min-height:42px"
		/>
		<button
			class="btn btn-primary"
			type="submit"
			style="white-space:nowrap;padding:10px 20px;min-height:42px;font-size:14px"
		>
			Subscribe
		</button>
	</form>
{/if}
