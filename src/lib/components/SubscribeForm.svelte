<script lang="ts">
	let { maxWidth = '440px' }: { maxWidth?: string } = $props();
</script>

<form
	style="display:flex;gap:0;max-width:{maxWidth}"
	data-testid="subscribe-form"
	onsubmit={(e) => e.preventDefault()}
>
	<input
		class="input"
		type="email"
		name="email"
		placeholder="your@email.com"
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
