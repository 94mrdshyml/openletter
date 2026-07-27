<script lang="ts">
	import { resolve } from '$app/paths';

	let {
		role,
		context
	}: {
		role: 'admin' | 'reader';
		context: 'public' | 'admin';
	} = $props();

	let open = $state(false);
	let wrapperEl: HTMLDivElement | undefined = $state();
	let buttonEl: HTMLButtonElement | undefined = $state();
	let menuPosition = $state('');

	// A nav row can have overflow-x:auto for wide content (see AdminNav), and
	// per the CSS overflow spec, setting overflow-x on an axis forces the
	// other axis's "visible" to become "auto" too — so a position:absolute
	// dropdown gets clipped by that ancestor. Fixed positioning computed from
	// the trigger's own bounding rect escapes any ancestor's overflow/clip.
	function toggle() {
		if (open) {
			close();
			return;
		}
		if (buttonEl) {
			const rect = buttonEl.getBoundingClientRect();
			menuPosition = `top:${rect.bottom + 8}px;right:${window.innerWidth - rect.right}px;`;
		}
		open = true;
	}

	function close() {
		open = false;
	}

	function onWindowClick(e: MouseEvent) {
		if (open && wrapperEl && !wrapperEl.contains(e.target as Node)) close();
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div bind:this={wrapperEl} style="display:contents">
	<button
		bind:this={buttonEl}
		type="button"
		onclick={toggle}
		aria-expanded={open}
		aria-label="Account menu"
		style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:none;border:none;padding:0;cursor:pointer;color:var(--color-text)"
	>
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			aria-hidden="true"
		>
			<line x1="3" y1="6" x2="21" y2="6"></line>
			<line x1="3" y1="12" x2="21" y2="12"></line>
			<line x1="3" y1="18" x2="21" y2="18"></line>
		</svg>
	</button>
	{#if open}
		<div
			style="position:fixed;{menuPosition}min-width:180px;background:var(--color-bg);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);z-index:50;display:flex;flex-direction:column;padding:4px 0"
		>
			{#if role === 'admin' && context === 'public'}
				<a
					href={resolve('/dashboard')}
					onclick={close}
					style="padding:10px 16px;font-size:14px;color:var(--color-text);text-decoration:none;white-space:nowrap"
				>
					Dashboard
				</a>
			{/if}
			<a
				href={resolve('/my-profile')}
				onclick={close}
				style="padding:10px 16px;font-size:14px;color:var(--color-text);text-decoration:none;white-space:nowrap"
			>
				My profile
			</a>
			{#if context === 'admin'}
				<a
					href={resolve('/')}
					onclick={close}
					style="padding:10px 16px;font-size:14px;color:var(--color-text);text-decoration:none;white-space:nowrap"
				>
					View publication →
				</a>
			{/if}
			<form method="POST" action="/logout" style="display:contents">
				<button
					type="submit"
					style="text-align:left;background:none;border:none;padding:10px 16px;font:inherit;font-size:14px;color:var(--color-text);cursor:pointer;white-space:nowrap"
				>
					Log out
				</button>
			</form>
		</div>
	{/if}
</div>
