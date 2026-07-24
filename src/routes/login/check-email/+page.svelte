<script lang="ts">
	import { page } from '$app/state';

	let email = $derived(page.url.searchParams.get('email') ?? '');
	const name = $derived(page.data.publication?.name ?? 'OpenLetter');
</script>

<svelte:head>
	<title>Check your inbox · {name}</title>
</svelte:head>

<div style="min-height:100vh;display:flex;flex-direction:column">
	<div style="height:3px;background:var(--color-accent)"></div>
	<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px">
		<div style="width:min(480px, 100%);padding:60px 48px">
			<div
				style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent);margin:0 0 24px;font-family:var(--font-heading);font-weight:800"
			>
				OpenLetter
			</div>
			<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">Check your inbox</h2>
			<p style="font-size:15px;color:var(--color-neutral-600);margin:0 0 24px;line-height:1.6">
				A sign-in link has been sent to <strong style="color:var(--color-text)">{email}</strong>.
				Click it to access your dashboard.
			</p>
			<div style="border-top:2px solid var(--color-divider);padding:16px 0 0">
				<form
					method="POST"
					style="font-size:13px;color:var(--color-neutral-500);margin:0;line-height:1.5"
				>
					<input type="hidden" name="email" value={email} />
					Didn't receive it? Check your spam folder, or
					<button
						type="submit"
						class="btn-ghost"
						style="background:none;border:none;padding:0;font:inherit;cursor:pointer;color:var(--color-accent);text-decoration:none;font-family:var(--font-heading);font-weight:800"
						>resend the link</button
					>.
				</form>
			</div>
		</div>
	</div>
</div>
