<script lang="ts">
	import { publication } from '$lib/mock-data';
</script>

<svelte:head>
	<title>Sign in · {publication.name}</title>
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
			<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">Sign in</h2>
			<p style="font-size:14px;color:var(--color-neutral-600);margin:0 0 28px;line-height:1.5">
				Enter your email to receive a sign-in link.
			</p>
			<form method="POST">
				<div class="field" style="margin:0 0 16px">
					<label for="email">Email address</label>
					<input
						class="input"
						id="email"
						name="email"
						type="email"
						placeholder="you@example.com"
						style="font-size:15px;padding:10px 14px;min-height:42px"
						required
					/>
				</div>
				<button
					type="submit"
					class="btn btn-primary btn-block"
					style="padding:10px 20px;min-height:42px;font-size:14px"
				>
					Send sign-in link
				</button>
			</form>
		</div>
	</div>
</div>
