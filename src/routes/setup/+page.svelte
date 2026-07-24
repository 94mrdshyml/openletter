<script lang="ts">
	import { publication } from '$lib/mock-data';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Set up your publication · {publication.name}</title>
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
			<h2 style="font-size:28px;margin:0 0 8px;letter-spacing:-0.02em">Set up your account</h2>
			<p style="font-size:14px;color:var(--color-neutral-600);margin:0 0 28px;line-height:1.5">
				You're the first person here — this creates the admin account for this publication.
			</p>

			{#if form?.message}
				<p style="font-size:14px;color:var(--color-accent);margin:0 0 20px">{form.message}</p>
			{/if}

			<form
				method="POST"
				enctype="multipart/form-data"
				style="display:flex;flex-direction:column;gap:16px"
			>
				<div class="field">
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
				<div style="display:flex;gap:16px">
					<div class="field" style="flex:1">
						<label for="firstName">First name</label>
						<input
							class="input"
							id="firstName"
							name="firstName"
							type="text"
							style="font-size:15px;padding:10px 14px;min-height:42px"
							required
						/>
					</div>
					<div class="field" style="flex:1">
						<label for="lastName">Last name</label>
						<input
							class="input"
							id="lastName"
							name="lastName"
							type="text"
							style="font-size:15px;padding:10px 14px;min-height:42px"
							required
						/>
					</div>
				</div>
				<div class="field">
					<label for="picture">Profile picture (optional)</label>
					<input class="input" id="picture" name="picture" type="file" accept="image/*" />
				</div>
				<button
					type="submit"
					class="btn btn-primary btn-block"
					style="padding:10px 20px;min-height:42px;font-size:14px;margin-top:8px"
				>
					Create admin account
				</button>
			</form>
		</div>
	</div>
</div>
