# OpenLetter — Security Audit

**Date:** 2026-07-26
**Scope:** Full repository at commit `34a0e20` (`main`) — SvelteKit app on Cloudflare Workers, D1 (Drizzle), R2, Better Auth (magic link), Resend.
**Method:** Manual source review of every server-side route, hook, and lib; auth/authorization flow tracing; secrets and CI/CD review; dependency and configuration review. Framework behaviour claims were verified against the pinned `@sveltejs/kit@2.63.0` source, not assumed.

---

## Executive summary

The codebase is small, readable, and gets several hard things right: the `/setup` race is closed with a real database constraint rather than a check-then-act, `resendApiKey` is deliberately kept out of every client payload, IDs are CSPRNG-backed, and every database access goes through Drizzle's parameterised query builder (no SQL injection surface anywhere in the repo). Secrets are correctly kept out of git.

There is, however, **one critical, remotely exploitable privilege-escalation chain that hands full admin control of any deployed instance to any member of the public**, and it is caused by a single framework misunderstanding: `+layout.server.ts` load guards do not protect form actions. Everything else in this report is secondary to fixing that.

### Ranked findings

| #  | Severity | Finding | Est. CVSS |
|----|----------|---------|-----------|
| [F-01](#f-01--critical--missing-authorization-on-dashboardsettings-form-actions) | **Critical** | Missing authorization on `/dashboard/settings` form actions → any reader escalates to admin | 9.1 |
| [F-02](#f-02--high--test-only-admin-login-bypass-ships-in-the-production-bundle) | **High** | Test-only admin login bypass ships in the production bundle | 8.1 |
| [F-03](#f-03--high--no-rate-limiting-on-magic-link-email-sending) | **High** | No rate limiting on magic-link sending → email bombing, spam relay, cost/reputation damage | 7.5 |
| [F-04](#f-04--high--unclaimed-setup-is-an-unauthenticated-instance-takeover-window) | **High** | Unclaimed `/setup` is an unauthenticated instance-takeover window | 7.3 |
| [F-05](#f-05--medium--stored-xss-via-svg-upload-to-the-public-r2-bucket) | **Medium** | Stored XSS via SVG upload to the public R2 bucket | 6.1 |
| [F-06](#f-06--medium--auth-baseurl-derived-from-the-request-no-trustedorigins-extra-public-origins) | **Medium** | Auth `baseURL` derived from the request; no `trustedOrigins`; extra public origins enabled | 6.1 |
| [F-07](#f-07--medium--subscriber-email-enumeration) | **Medium** | Subscriber email enumeration oracle | 5.3 |
| [F-08](#f-08--medium--resend-api-key-stored-in-plaintext-in-d1) | **Medium** | Resend API key stored in plaintext in D1 | 5.5 |
| [F-09](#f-09--medium--no-security-response-headers) | **Medium** | No CSP, `X-Frame-Options`, `Referrer-Policy`, or HSTS | 5.4 |
| [F-10](#f-10--medium--invitation-flow-weaknesses) | **Medium** | Invitation flow: token in query string, premature `emailVerified`, no revocation | 5.0 |
| [F-11](#f-11--low--html-injection-in-transactional-email-templates) | Low | HTML injection in transactional email templates | 4.3 |
| [F-12](#f-12--low--csrf-origin-check-is-bypassable-for-non-form-post-endpoints) | Low | SvelteKit CSRF check bypassable for non-form POST endpoints (`/logout`) | 4.3 |
| [F-13](#f-13--low--no-input-validation-on-any-server-action) | Low | No input validation on any server action | 3.7 |
| [F-14](#f-14--low--unbounded-uploads-and-no-storage-quota) | Low | Unbounded R2 uploads, no quota or rate limit | 3.7 |
| [F-15](#f-15--low--third-party-font-cdn-with-no-sri) | Low | Third-party font CDN on every page, no SRI | 3.1 |
| [F-16](#f-16--informational--no-unsubscribe-or-data-deletion-path-for-subscribers) | Info | No unsubscribe / data-deletion path for subscriber PII |  — |
| [F-17](#f-17--informational--no-audit-logging-of-privileged-actions) | Info | No audit logging of privileged actions |  — |
| [F-18](#f-18--informational--db-read-on-every-request-including-static-assets) | Info | Database read on every request including static assets |  — |

### What is *not* a problem (verified)

- **SQL injection** — every query goes through Drizzle's parameterised builder. No string-concatenated SQL, no `sql.raw` with user input.
- **XSS in the app itself** — zero uses of `{@html}`, `innerHTML`, or `eval` anywhere in `src/`. Svelte escapes all interpolation by default.
- **Secrets in git** — no `.dev.vars`, `.env`, tokens, or keys committed. `.gitignore` is correct. The one committed-looking value (`MEDIA_PUBLIC_URL`) is a public R2 URL, which is fine.
- **CI secret exposure** — `ci.yml` uses `pull_request` (not `pull_request_target`), so fork PRs never receive `BETTER_AUTH_SECRET`. The deploy job is gated behind `environment: production` and `needs: build`.
- **The `/setup` race** — genuinely closed by the `setup_lock` PRIMARY KEY, and the lock is claimed *before* any other work in the action. This is the correct pattern and, notably, the only action in the codebase that defends itself rather than relying on a load function.
- **`resendApiKey` leakage to the client** — correctly excluded in both `+layout.server.ts` (explicit column allow-list) and `dashboard/settings/+page.server.ts` (destructured out).
- **Dependencies** — `better-auth@1.6.24`, `drizzle-orm@0.45.2`, `nanoid@6.0.0` are current with no known advisories at time of review.

---

## F-01 — CRITICAL — Missing authorization on `/dashboard/settings` form actions

**Files:** `src/routes/dashboard/settings/+page.server.ts`, `src/routes/dashboard/+layout.server.ts`, `src/hooks.server.ts`
**Class:** CWE-862 Missing Authorization / CWE-269 Improper Privilege Management
**Impact:** Complete remote takeover of any deployed instance by any member of the public.

### What it is

The only thing standing between the public and the writer dashboard is `src/routes/dashboard/+layout.server.ts`:

```ts
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		redirect(303, '/login');
	}
};
```

That guard protects *page rendering*. It does **not** protect *form actions*, because SvelteKit runs actions before it runs any `load` function. Verified in `@sveltejs/kit@2.63.0`, `src/runtime/server/page/index.js`:

```
line  77:   action_result = await handle_action_request(event, event_state, leaf_node.server);
...
line 228:   return await load_data({ ... })     // layout/page loads run here — after
```

The action executes, commits its database writes, and only then does SvelteKit run the layout load whose redirect would have blocked the request. The redirect arrives too late to matter.

Nothing else covers the gap. `hooks.server.ts` — the one place that *does* run before everything — only handles the setup redirect and session hydration; it has no `/dashboard` gate.

So both actions on this page are reachable by anyone holding **any** session, including a plain reader's:

- `?/invite` — issues an admin invitation to an arbitrary email address
- `?/save` — rewrites the entire publication record, including the Resend API key, from-address, Segment and Topic ids

### Full exploit chain

Getting a reader session requires no approval from anyone — the public subscribe form hands one out:

1. Attacker submits their own email to the public subscribe form on the homepage (`(public)/+page.server.ts` → `signInMagicLink`).
2. They click the magic link in their own inbox. They now hold a valid session with `role: 'reader'`.
3. They send one request:
   ```
   POST /dashboard/settings?/invite
   Origin: https://victim-publication.com
   Cookie: <their own reader session>
   Content-Type: application/x-www-form-urlencoded

   email=attacker@evil.com
   ```
   `locals.user` is populated (they are a legitimate reader), so `locals.user!.id` resolves, the invitation row is written, and `sendInvitationEmail` delivers an admin invite to the attacker's own inbox.
4. They open `/invite/accept?token=…`, which sets `role: 'admin'` and `emailVerified: true` on their account and signs them in.
5. They are now an administrator of the publication.

The SvelteKit CSRF origin check does not help — the attacker sends the request themselves with a matching `Origin` header. It is a `curl` one-liner, not a cross-site trick.

Even without step 3–5, `?/save` alone is a serious standalone compromise: an unauthorized caller can overwrite `resendFromEmail` and `resendApiKey` to redirect the publication's entire transactional email flow through an attacker-controlled Resend account, or blank the config to silently break all email delivery.

### Why it is Critical

Unauthenticated-adjacent (the prerequisite is self-service), no user interaction from the victim, no special positioning, and the outcome is full administrative control plus the subscriber list. On a multi-instance self-hosted product, this is exploitable against every deployment simultaneously.

### Fix

Two changes. Do both — the first is the correct architectural fix, the second is defence in depth.

**1. Gate `/dashboard` in `hooks.server.ts`, which runs before actions:**

```ts
// src/hooks.server.ts — after session hydration
event.locals.session = session?.session ?? null;
event.locals.user = session?.user ?? null;

if (event.url.pathname.startsWith('/dashboard')) {
	if (!event.locals.user) redirect(303, '/login');
	if (event.locals.user.role !== 'admin') error(403, 'Forbidden');
}

return resolve(event);
```

**2. Re-check inside each privileged action.** A route-prefix check in a hook is one refactor away from being wrong; the action should not depend on it:

```ts
function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') error(403, 'Forbidden');
	return locals.user;
}

export const actions: Actions = {
	save: async ({ request, platform, locals }) => {
		requireAdmin(locals);
		// …
	},
	invite: async ({ request, platform, url, locals }) => {
		const admin = requireAdmin(locals);
		// … use admin.id instead of locals.user!.id
	}
};
```

Note the `locals.user!` non-null assertion in the current `invite` action — that `!` is exactly where the type system was silently told to stop asking the question that mattered. Removing it in favour of `requireAdmin` makes the guard load-bearing rather than assumed.

**3. Audit every other action in the codebase against the same rule.** I checked all of them: `my-profile` correctly re-checks `locals.user` inside its action, and `/setup` correctly claims its lock inside the action. Those two are fine. Add a code-review checklist item: *every `+page.server.ts` action performs its own authorization; a `load` guard never counts.*

---

## F-02 — HIGH — Test-only admin login bypass ships in the production bundle

**File:** `src/routes/api/test/login/+server.ts`
**Class:** CWE-489 Active Debug Code / CWE-288 Authentication Bypass Using an Alternate Path
**Impact:** Instant unauthenticated admin session for anyone, if a single environment variable is ever set.

### What it is

```ts
export const GET: RequestHandler = async ({ platform, url }) => {
	if (env.ENABLE_TEST_AUTH !== 'true') return new Response('Not found', { status: 404 });

	const email = url.searchParams.get('email') ?? 'test-writer@example.com';
	const role = url.searchParams.get('role') === 'reader' ? 'reader' : 'admin';
	// … mints a session for any email, defaulting to admin, and returns the cookies
};
```

A `GET` request with no authentication mints a session for **any email address**, and `role` **defaults to `admin`**. The endpoint is guarded only by a runtime environment-variable check, which means:

- The route, the `testUtils()` plugin, and the entire session-forging code path are compiled into the deployed Worker. This is a permanently loaded gun; only the runtime check keeps it from firing.
- The guard fails open on any misconfiguration. Both `ci.yml` and `deploy.yml` write `ENABLE_TEST_AUTH=true` into `.dev.vars`, and `.dev.vars.example` ships it to every self-hoster. A self-hoster who copies the example file into a `[vars]` block, or an operator who sets it for debugging, converts their instance into an open admin portal.
- It is explicitly exempted from the setup redirect in `hooks.server.ts` (`!event.url.pathname.startsWith('/api/')`), so it is reachable even pre-setup.
- Defaulting the role to `admin` rather than `reader` inverts fail-safe defaults inside code that is already dangerous.

I verified the deploy path: `wrangler deploy` does not upload `.dev.vars`, and `wrangler.jsonc`'s `vars` block does not contain `ENABLE_TEST_AUTH`, so **the current production deployment is not exploitable today**. This is rated High on the strength of the blast radius and the single-point-of-failure guard, not on a live exploit.

### Fix

Exclude it at build time so it cannot exist in a production artifact:

```ts
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ platform, url }) => {
	if (!dev || platform!.env.ENABLE_TEST_AUTH !== 'true') {
		return new Response('Not found', { status: 404 });
	}
	// …
};
```

`$app/environment`'s `dev` is statically replaced at build time, so a production build dead-code-eliminates the body rather than merely refusing to run it. Additionally:

- Flip the default: `const role = url.searchParams.get('role') === 'admin' ? 'admin' : 'reader';` and have the e2e helper pass `role=admin` explicitly.
- Require a shared secret in the query string, sourced from `BETTER_AUTH_SECRET`, as a second factor.
- Add a CI check that greps the built `_worker.js` for `testUtils` and fails the build if present.
- Remove `ENABLE_TEST_AUTH` from `.dev.vars.example`, or rename it to something self-evidently dangerous (`DANGEROUS_ENABLE_TEST_AUTH_LOCAL_ONLY`).

---

## F-03 — HIGH — No rate limiting on magic-link email sending

**Files:** `src/routes/login/+page.server.ts`, `src/routes/login/check-email/+page.server.ts`, `src/routes/(public)/+page.server.ts`, `src/routes/setup/+page.server.ts`
**Class:** CWE-770 Allocation of Resources Without Limits / CWE-799 Improper Control of Interaction Frequency
**Impact:** Email bombing of arbitrary third parties, Resend quota and cost exhaustion, sender-domain reputation damage, magic-link token brute-force surface.

### What it is

Four separate routes accept an arbitrary attacker-supplied email address and send an email, with no throttling of any kind. The worst is the resend endpoint, which has no rate limit and no state check whatsoever:

```ts
// src/routes/login/check-email/+page.server.ts
export const actions: Actions = {
	default: async ({ request, platform, url }) => {
		const email = String(data.get('email') ?? '');
		await auth.api.signInMagicLink({ body: { email, callbackURL: '/dashboard' }, headers: request.headers });
		return { resent: true };
	}
};
```

A loop against this endpoint delivers unlimited branded "Sign in to <Publication>" emails to any address the attacker names. The recipient never signed up. From their perspective the publication is spamming them, and the email genuinely originates from the publication's verified Resend domain — so the abuse reports, the spam-folder classification, and the eventual domain suspension all land on the writer.

Better Auth's built-in rate limiter does not apply here, for two independent reasons:

1. These routes call `auth.api.signInMagicLink(...)` **as a server-side function call**, bypassing Better Auth's HTTP middleware layer where rate limiting lives.
2. Even for requests that do go through `/api/auth/*`, Better Auth's default rate-limit storage is in-memory. On Cloudflare Workers every isolate has its own memory and isolates are created and destroyed freely, so an in-memory counter provides close to zero protection under real traffic.

Secondary effects: unbounded verification-row creation in D1, direct financial cost against the writer's Resend plan, and an enlarged window for magic-link token guessing (Better Auth's tokens are strong, so this last one is theoretical).

### Fix

Rate-limit before sending, keyed on both the target email and the client IP:

- Add a Cloudflare **Rate Limiting binding** (or a Durable Object / KV counter) and check it at the top of each of the four actions. A reasonable starting policy: 3 sends per email per 15 minutes, 10 sends per IP per hour.
- Configure Better Auth with a persistent rate-limit store rather than the memory default, so the `/api/auth/*` surface is covered too:
  ```ts
  rateLimit: { enabled: true, storage: 'database', window: 60, max: 10 }
  ```
- On `/login/check-email`, do not accept an email from the form body at all. Carry the pending address in a short-lived signed cookie set by the originating `/login` action, so the resend endpoint can only ever re-send to an address that already requested one.
- Add Cloudflare Turnstile to the public subscribe form and the login form. This is the cheapest high-leverage control available on Workers.
- Return a constant response and constant timing regardless of outcome (see also [F-07](#f-07--medium--subscriber-email-enumeration)).

---

## F-04 — HIGH — Unclaimed `/setup` is an unauthenticated instance-takeover window

**Files:** `src/routes/setup/+page.server.ts`, `src/hooks.server.ts`
**Class:** CWE-306 Missing Authentication for Critical Function
**Impact:** Whoever reaches a freshly deployed instance first becomes its permanent administrator.

### What it is

Between `wrangler deploy` and the writer completing the setup wizard, `/setup` is a fully unauthenticated endpoint that grants permanent administrator control to whoever posts to it first. Because the lock is claimed atomically the window closes cleanly and cannot be re-opened — but it is a real window, and the design widens it in three ways:

- `wrangler.jsonc` sets `"workers_dev": true` and `"preview_urls": true`, so the instance is publicly reachable at `openletter.<subdomain>.workers.dev` and at per-deployment preview URLs, often before the writer has pointed a domain at it or knows it is live.
- Cloudflare Workers deployments appear in Certificate Transparency logs and `workers.dev` subdomains are trivially enumerable. Automated scanners find these in minutes.
- The attacker also gets to supply `resendApiKey`, `resendFromEmail`, and `pubName` — so the hijacked instance immediately sends attacker-branded email from the writer's future domain.

This is a deliberate "Ghost-style" design choice, documented in `hooks.server.ts`. Ghost has the same exposure and it is a recurring source of real-world compromises for self-hosted Ghost instances. Documented does not mean safe.

### Fix

Require proof of deployment control, not merely first arrival. Best options in order of strength:

1. **Setup token.** Have the provisioning CLI generate a random token, store it via `wrangler secret put SETUP_TOKEN`, and print `https://<host>/setup?token=…` for the writer. `/setup` rejects any request whose token does not match (compare in constant time). This binds setup to whoever holds Cloudflare credentials — exactly the right authority.
2. **Fail closed by default.** Refuse setup entirely unless `SETUP_TOKEN` is present, so a self-hoster cannot accidentally deploy an open instance.
3. **Narrow the window.** Set `"workers_dev": false` and `"preview_urls": false` in `wrangler.jsonc` for production, so the instance is only reachable on the intended hostname.
4. **Alert on completion.** Have `/setup` notify the Cloudflare account owner's email that setup completed, and from which IP — so a hijack is at least detected quickly.

Also worth fixing while you are in this file: the setup action performs R2 uploads (`uploadAvatar`, `uploadLogo`) for whatever files are posted, immediately after claiming the lock. That is unauthenticated R2 write access during the window. Validate before uploading.

---

## F-05 — MEDIUM — Stored XSS via SVG upload to the public R2 bucket

**File:** `src/lib/server/media.ts`
**Class:** CWE-79 Stored XSS / CWE-434 Unrestricted Upload of File with Dangerous Type
**Impact:** Attacker-controlled script execution and phishing content hosted on the publication's media domain.

### What it is

```ts
if (!file.type.startsWith('image/')) throw new Error('File must be an image');
const ext = file.type.split('/')[1] ?? 'bin';
const key = `${folder}/${crypto.randomUUID()}.${ext}`;
await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
```

Three compounding problems:

1. **`file.type` is entirely client-controlled.** It is the `Content-Type` the browser (or `curl`) puts in the multipart part header. It is never validated against the actual bytes.
2. **`image/svg+xml` passes the `startsWith('image/')` check.** SVG is an XML document that executes `<script>` when served as `image/svg+xml` and navigated to directly.
3. **The declared type is echoed back as the stored `contentType`**, so R2 serves it with exactly the header needed for execution.

An attacker uploads an SVG containing `<script>` as their profile avatar, then distributes the resulting `https://pub-….r2.dev/avatars/<uuid>.svg+xml` link. Any visitor who opens it runs attacker JavaScript on the `r2.dev` origin.

Severity is Medium rather than High because `MEDIA_PUBLIC_URL` is a different origin from the app, so app session cookies are not directly reachable. It remains a real stored-XSS on a domain the publication vouches for, usable for convincing phishing, and `r2.dev` is a shared origin — script there sits alongside other tenants' content. Note also that the derived extension is literally `svg+xml`, which is a good smell that the extension derivation is wrong in general.

### Fix

```ts
const ALLOWED = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif'
} as const;

async function uploadImage(env: Env, file: File, folder: string): Promise<string> {
	const bytes = await file.arrayBuffer();
	if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('File must be under 5MB');

	const sniffed = sniffImageType(bytes);          // magic bytes, not file.type
	const ext = ALLOWED[sniffed as keyof typeof ALLOWED];
	if (!ext) throw new Error('File must be a JPEG, PNG, WebP, or GIF');

	const key = `${folder}/${crypto.randomUUID()}.${ext}`;
	await env.MEDIA.put(key, bytes, {
		httpMetadata: { contentType: sniffed, contentDisposition: 'inline' }
	});
	return `${env.MEDIA_PUBLIC_URL}/${key}`;
}
```

`sniffImageType` should check magic bytes: `FF D8 FF` (JPEG), `89 50 4E 47` (PNG), `RIFF….WEBP`, `GIF8`. Never trust `file.type` for anything but a first-pass UX hint.

Additionally: serve media through a Cloudflare Worker route or a custom domain with `Content-Security-Policy: default-src 'none'; sandbox` and `X-Content-Type-Options: nosniff`, rather than exposing the raw `r2.dev` URL. Also note the size check currently runs against `file.size`, which is metadata; check the actual buffer length as above.

---

## F-06 — MEDIUM — Auth `baseURL` derived from the request, no `trustedOrigins`, extra public origins

**Files:** `src/lib/server/auth.ts`, `src/hooks.server.ts`, all callers of `createAuth`, `wrangler.jsonc`
**Class:** CWE-346 Origin Validation Error
**Impact:** Magic links minted for an unintended origin; multiple live origins for one instance.

### What it is

Every call site constructs the auth instance from the request's own origin:

```ts
const auth = createAuth(env, url.origin);   // hooks.server.ts, and every route
```

Better Auth uses `baseURL` to build the magic-link URL it emails out, and `trustedOrigins` is never configured — so it falls back to trusting whatever `baseURL` it was handed. This makes the origin embedded in an emailed authentication link a function of an inbound request property rather than of configuration.

On Cloudflare Workers, requests generally must resolve to a hostname routed to the Worker, which limits classic Host-header injection. But this deployment deliberately enables three separate hostname families:

```jsonc
"workers_dev": true,
"preview_urls": true,
```

plus any custom domain. All of them serve the same Worker against the same D1 database. A magic link requested via the `workers.dev` origin is valid, and a session established there is a session on the same user records. That is a larger authentication surface than the writer thinks they have, and it means the security of the production publication depends on the obscurity of its `workers.dev` name.

### Fix

Pin the origin to configuration and declare trusted origins explicitly:

```ts
// wrangler.jsonc → "vars": { "PUBLIC_ORIGIN": "https://the-publication.com" }

export function createAuth(env: Env, requestOrigin: string) {
	const baseURL = env.PUBLIC_ORIGIN ?? requestOrigin;
	return betterAuth({
		baseURL,
		trustedOrigins: [baseURL],
		// …
	});
}
```

Then set `"workers_dev": false` and `"preview_urls": false` for the production environment, so the instance answers on exactly one hostname. If preview deployments are wanted, give them their own D1 database rather than sharing production data.

---

## F-07 — MEDIUM — Subscriber email enumeration

**File:** `src/routes/(public)/+page.server.ts`
**Class:** CWE-204 Observable Response Discrepancy / CWE-359 Exposure of Private Information
**Impact:** Anyone can test whether a given email address subscribes to the publication.

### What it is

```ts
const existing = await db.query.subscriber.findFirst({ where: eq(subscriber.email, email) });
if (existing) return { alreadySubscribed: true };
// … otherwise send a magic link
return { subscribed: true };
```

The two branches return different data and take observably different time (one sends an email, one does not). An unauthenticated attacker can iterate a list of addresses and reconstruct a large portion of the subscriber list.

`CLAUDE.md` explicitly classifies reader email addresses as PII. For a publication on a sensitive topic — political, medical, dissident, or simply niche — "who reads this" is exactly the information a reader expects to be private, and disclosing it can have consequences well beyond the product. Also note that `/login` has the same shape: it will happily reveal via timing whether an address maps to an existing user.

### Fix

Make the response and the timing constant. Always return the same result and always do the same work:

```ts
export const actions: Actions = {
	subscribe: async ({ request, platform, url }) => {
		const email = String(data.get('email') ?? '');
		const existing = await db.query.subscriber.findFirst({ where: eq(subscriber.email, email) });
		if (!existing) {
			await auth.api.signInMagicLink({ body: { email, callbackURL: '/' }, headers: request.headers });
		} else {
			await sendAlreadySubscribedEmail(platform!.env, email);  // same shape of work
		}
		return { submitted: true };
	}
};
```

The UI then always says "Check your inbox" — and the person who is already subscribed gets a short "you're already subscribed" email instead. This is the standard pattern; it moves the answer into a channel only the address owner can read. Combine with the rate limiting from [F-03](#f-03--high--no-rate-limiting-on-magic-link-email-sending), which is what actually makes bulk enumeration impractical.

---

## F-08 — MEDIUM — Resend API key stored in plaintext in D1

**Files:** `src/lib/server/db/schema.ts`, `src/routes/setup/+page.server.ts`, `src/routes/dashboard/settings/+page.server.ts`
**Class:** CWE-312 Cleartext Storage of Sensitive Information
**Impact:** A read-only database disclosure yields a live third-party API credential.

### What it is

`publication.resendApiKey` holds a live Resend API key as plaintext text. The application-layer handling is genuinely careful — the key never reaches a client payload, and the "blank means unchanged" partial-update pattern in settings is correct. But the storage itself has no protection, so anything that can read one row of D1 gets a working credential: a future SQL-injection bug, an over-broad Cloudflare API token, a D1 backup or export, a support-debug session, or a misconfigured read replica.

A leaked Resend key lets an attacker send mail as the publication's verified domain and, depending on key scope, read the contact list — which is the subscriber list, i.e. the PII this project set out to protect.

This is a deliberate, well-reasoned architectural choice (documented at length in `CLAUDE.md`, and I am not proposing reverting it). The gap is that "stored in D1 instead of a secret store" was not paired with "therefore encrypt it".

### Fix

Encrypt the key at rest with a key that lives outside the database:

```ts
// Encrypt with AES-GCM using a Cloudflare secret as the wrapping key
const wrappingKey = await crypto.subtle.importKey(
	'raw', hexToBytes(env.ENCRYPTION_KEY), 'AES-GCM', false, ['encrypt', 'decrypt']
);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, encoded);
// store as `${base64(iv)}.${base64(ciphertext)}`
```

Provision `ENCRYPTION_KEY` via `wrangler secret put` in the CLI, alongside `BETTER_AUTH_SECRET`. Decrypt only at the point of use in `mail.ts` and `resend.ts`. Now a database disclosure alone is not enough — the attacker also needs the Worker's secret store.

Also: instruct writers to create a **sending-only, restricted** Resend key rather than a full-access one, and document key rotation.

---

## F-09 — MEDIUM — No security response headers

**Files:** `src/hooks.server.ts`, `src/app.html`
**Class:** CWE-1021 Improper Restriction of Rendered UI Layers / CWE-693 Protection Mechanism Failure
**Impact:** No defence-in-depth against XSS, clickjacking, or referrer leakage.

### What it is

The app sets no security headers at all. Missing: `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`.

Concrete consequences today:

- **Clickjacking.** The dashboard, `/setup`, and `/login` can be framed by any site. A framed `/setup` on an unclaimed instance ([F-04](#f-04--high--unclaimed-setup-is-an-unauthenticated-instance-takeover-window)) is a clean UI-redress takeover.
- **Referrer leakage.** With no `Referrer-Policy`, the full URL of `/invite/accept?token=…` and `/login/check-email?email=…` is sent in the `Referer` header to every third-party resource loaded on that page. The app already loads Google Fonts on every page ([F-15](#f-15--low--third-party-font-cdn-with-no-sri)), so an admin invitation token is disclosed to a third party on page load. That interaction is what lifts this from Low to Medium.
- **No CSP.** Today the app has no `{@html}` sinks, but the roadmap includes a Tiptap editor rendering writer-authored HTML. When that lands, CSP is the difference between a bug and a breach.

### Fix

Add to `hooks.server.ts`:

```ts
const response = await resolve(event);

response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
response.headers.set(
	'Content-Security-Policy',
	[
		"default-src 'self'",
		"script-src 'self'",
		"style-src 'self' 'unsafe-inline'",
		`img-src 'self' data: ${env.MEDIA_PUBLIC_URL}`,
		"font-src 'self'",
		"frame-ancestors 'none'",
		"form-action 'self'",
		"base-uri 'none'"
	].join('; ')
);

return response;
```

SvelteKit also supports CSP natively via `kit.csp` in `svelte.config.js` with `mode: 'auto'`, which hashes its own inline scripts — prefer that over hand-rolling `script-src` if you keep inline hydration scripts. Note that self-hosting fonts ([F-15](#f-15--low--third-party-font-cdn-with-no-sri)) is what lets `font-src`/`style-src` stay tight.

---

## F-10 — MEDIUM — Invitation flow weaknesses

**Files:** `src/routes/dashboard/settings/+page.server.ts`, `src/routes/invite/accept/+page.server.ts`
**Class:** CWE-598 Sensitive Information in Query String / CWE-863 Incorrect Authorization
**Impact:** Admin-invitation tokens leak through side channels; invitations cannot be revoked.

The token itself is fine — `crypto.randomUUID()` is CSPRNG-backed with ~122 bits of entropy, single-use by status, and 7-day expiry. The surrounding flow is not.

1. **Token travels in a query string** (`/invite/accept?token=…`). Query strings land in browser history, in `Referer` headers to third parties (see [F-09](#f-09--medium--no-security-response-headers)), in corporate proxy logs, and in shared-link screenshots. An admin-grant token deserves better. Deliver it as a POST body or a path segment with `Referrer-Policy: no-referrer` on that route.

2. **`emailVerified: true` and `role: 'admin'` are set before the invitee proves control of the mailbox.** The `accept` action writes the admin role first and *then* sends a magic link. Anyone who obtains the token — from a forwarded email, a leaked `Referer`, browser history on a shared machine — permanently promotes that account, whether or not they can read the invited mailbox. Reverse the order: verify first via the magic link, and grant `admin` only in the callback.

3. **No revocation and no listing.** The schema has a `revoked` status but nothing ever sets it, and there is no UI to view pending invitations. An admin who mistypes an address cannot undo it for seven days.

4. **No limit on pending invitations, and no check that the inviter is still an admin at accept time.** Combined with [F-01](#f-01--critical--missing-authorization-on-dashboardsettings-form-actions), an attacker can seed many invitations and use them later even after the original hole is closed. **When fixing F-01, purge or audit any existing `pending` invitation rows** — otherwise the patch closes the door with the attacker's key already cut.

5. **Invitations are never scoped or rate-limited.** Add a cap on outstanding invitations and reuse the F-03 rate limiter here.

---

## F-11 — LOW — HTML injection in transactional email templates

**File:** `src/lib/server/mail.ts`
**Class:** CWE-79 Improper Neutralization of Input in an HTML Context

Every interpolation into the email template is unescaped:

```ts
`<img src="${logoUrl}" … />`
`<span …>${pubName}</span>`
`<a href="${ctaUrl}" …>${ctaText}</a>`
```

`pubName` and `logoUrl` are writer-controlled via `/setup` and `/dashboard/settings` with no validation. A publication name of `"><a href="https://evil.com">Click here</a><span x="` injects arbitrary markup into every transactional email the publication sends. Email clients block scripts, so this is not XSS — but it is a clean phishing-content injection into mail that arrives from a verified sender domain, which is exactly the trust the attacker wants to borrow.

Normally a writer injecting into their own emails is self-harm and barely worth noting. It matters here because [F-01](#f-01--critical--missing-authorization-on-dashboardsettings-form-actions) lets an unauthorized party set `pubName`, which turns this into an attacker-controlled phishing template delivered to the entire subscriber list.

**Fix:** escape every interpolated value.

```ts
const esc = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	 .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
```

Apply to `pubName`, `heading`, `body`, and `ctaText`. For `logoUrl` and `ctaUrl`, escape *and* validate the scheme is `https:` before interpolating into an attribute — an escaped `javascript:` URL is still a `javascript:` URL.

---

## F-12 — LOW — CSRF origin check is bypassable for non-form POST endpoints

**File:** `src/routes/logout/+server.ts`
**Class:** CWE-352 Cross-Site Request Forgery

Verified in `@sveltejs/kit@2.63.0`, `src/runtime/server/respond.js`:

```js
const forbidden =
	is_form_content_type(request) &&        // ← the check only fires for form content types
	(request.method === 'POST' || …) &&
	request_origin !== url.origin && …
```

SvelteKit's CSRF protection only engages when the request carries a form content type (`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`). A cross-origin `fetch(url, { method: 'POST', mode: 'no-cors' })` with no body sends no `Content-Type` and therefore skips the check entirely.

For `/logout` the impact is a forced logout — annoying, not dangerous. It is listed because it establishes that **the framework's CSRF protection does not cover `+server.ts` endpoints generically**, and this codebase will add more of them. Any future POST endpoint that mutates state and accepts JSON is unprotected by default.

**Fix:** check the origin explicitly in `hooks.server.ts` for all state-changing methods, independent of content type:

```ts
if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)) {
	const origin = event.request.headers.get('origin');
	if (origin !== event.url.origin) error(403, 'Cross-site request forbidden');
}
```

---

## F-13 — LOW — No input validation on any server action

**Files:** all `+page.server.ts` files
**Class:** CWE-20 Improper Input Validation

Every action follows the same shape:

```ts
const email = String(data.get('email') ?? '');
```

There is no validation anywhere in the codebase: no email format check, no length limits, no character-set restrictions, no shape check on the Resend key. Consequences:

- `/setup` and `/login` will create user rows and verification rows for syntactically invalid addresses, and hand them to Resend.
- A megabyte-long `pubName` or `description` is written to D1 verbatim, bloating the row that `+layout.server.ts` loads on *every single page render* — a cheap self-inflicted performance cliff, and an availability lever for an attacker holding [F-01](#f-01--critical--missing-authorization-on-dashboardsettings-form-actions).
- `slugify()` can only ever return `'publication'` for a name of pure non-ASCII (e.g. Devanagari or CJK), so two such publications would collide on the `slug` unique constraint. Not a security issue, but an availability one worth fixing nearby.

**Fix:** `zod` is already in the dependency tree (via `better-auth`). Define a schema per action and parse at the top:

```ts
const SettingsSchema = z.object({
	name: z.string().trim().min(1).max(200),
	tagline: z.string().trim().max(300).nullable(),
	description: z.string().trim().max(2000).nullable(),
	category: z.string().trim().max(100).nullable(),
	resendApiKey: z.string().regex(/^re_[A-Za-z0-9_]+$/).max(200).optional(),
	resendFromEmail: z.string().email().max(320).nullable()
});

const parsed = SettingsSchema.safeParse(Object.fromEntries(data));
if (!parsed.success) return fail(400, { errors: parsed.error.flatten() });
```

Do the same for `email` on all four magic-link routes (`z.string().email().max(320)`).

---

## F-14 — LOW — Unbounded uploads and no storage quota

**File:** `src/lib/server/media.ts`
**Class:** CWE-770 Allocation of Resources Without Limits

There is a 5 MB per-file cap and nothing else: no per-user quota, no rate limit, no total-bucket ceiling, and no cleanup of orphaned objects. Every avatar change writes a new R2 object and abandons the old one, so storage grows monotonically even in normal use.

Any authenticated reader can loop `/my-profile?/save` uploading 5 MB avatars indefinitely, running up R2 storage and Class A operation charges against the writer's account. Via [F-01](#f-01--critical--missing-authorization-on-dashboardsettings-form-actions) the same is true of the logo upload path.

**Fix:** rate-limit uploads per user (e.g. 5/hour), delete the previous object when replacing an avatar or logo, and add an R2 lifecycle rule to expire objects unreferenced by any database row. Check `bytes.byteLength` rather than the client-reported `file.size` (see [F-05](#f-05--medium--stored-xss-via-svg-upload-to-the-public-r2-bucket)).

---

## F-15 — LOW — Third-party font CDN with no SRI

**File:** `src/app.html`

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:…" rel="stylesheet" />
```

Every page load — including `/invite/accept?token=…` and `/login/check-email?email=…` — makes a request to Google, disclosing every reader's IP address, user agent, and (absent `Referrer-Policy`) the full referring URL including tokens and email addresses in the query string. There is no SRI hash, so a compromise of that origin yields CSS injection on every page. It also forces `style-src` to include a third-party host in any CSP you write ([F-09](#f-09--medium--no-security-response-headers)).

For a product whose stated wedge includes protecting reader privacy, leaking every reader's IP to a third-party analytics company on every page view is a poor default.

**Fix:** self-host the Archivo woff2 files in `static/fonts/` and declare `@font-face` in `app.css`. This removes the privacy leak, removes the SRI gap, tightens CSP, and is faster.

---

## F-16 — INFORMATIONAL — No unsubscribe or data-deletion path for subscribers

There is no route, action, or UI anywhere in the codebase that removes a `subscriber` row, deletes a `user`, or unsubscribes a Resend contact. Once an email address enters the system it stays.

This is a legal exposure, not a vulnerability: GDPR Art. 17 (erasure) and CAN-SPAM both require a working opt-out, and CAN-SPAM requires a one-click unsubscribe link in every commercial email — the current templates in `mail.ts` have none. For a product that will be self-hosted by writers in the EU and the US, shipping without this creates liability for every one of them.

**Fix:** add a signed unsubscribe token, an `/unsubscribe` route that deletes the subscriber row and calls Resend's contact-removal endpoint, and an unsubscribe footer link in every email template. Add a "delete my account and data" action to `/my-profile`.

---

## F-17 — INFORMATIONAL — No audit logging of privileged actions

Nothing records who invited whom, who changed the Resend configuration, when an account was promoted to admin, or which IP completed `/setup`. If [F-01](#f-01--critical--missing-authorization-on-dashboardsettings-form-actions) were exploited against a live instance today, there would be no way to determine whether it had happened, when, or by whom.

**Fix:** add an append-only `audit_log` table (actor id, action, target, IP, user agent, timestamp) and write to it from every privileged action: setup completion, invitation issued, invitation accepted, role change, settings save, Resend key change. Never log token values, magic-link URLs, or the Better Auth secret — and per `CLAUDE.md`, do not log reader email addresses outside D1.

---

## F-18 — INFORMATIONAL — Database read on every request including static assets

`src/hooks.server.ts` runs a `setupLock` query plus `auth.api.getSession()` — at least two D1 round-trips — on every request that is not `/setup` or `/api/*`, including static asset requests. This inflates D1 read costs and gives an unauthenticated attacker a cheap amplification factor against the database.

**Fix:** skip the hook for asset paths, and cache the "setup complete" boolean (it transitions exactly once and never back) in a module-level flag or the Cache API rather than querying per request.

---

## Recommended remediation order

**Immediately (before any further feature work):**

1. **[F-01]** Add the `/dashboard` guard in `hooks.server.ts` *and* per-action `requireAdmin()` checks. Then audit existing `user` rows for unexpected `role = 'admin'`, and purge pending `invitation` rows.
2. **[F-02]** Gate the test-login endpoint on `$app/environment`'s `dev` so it cannot exist in a production build; flip its default role to `reader`.

**This week:**

3. **[F-03]** Rate-limit all four magic-link send paths; stop accepting an arbitrary email on the resend endpoint.
4. **[F-04]** Introduce a `SETUP_TOKEN`; set `workers_dev: false` and `preview_urls: false`.
5. **[F-05]** Magic-byte validation and an extension allow-list in `media.ts`.

**This month:**

6. **[F-06]** Pin `baseURL` / `trustedOrigins` to a configured `PUBLIC_ORIGIN`.
7. **[F-09]** Add the security-header block, and self-host fonts **[F-15]** so CSP can be tight.
8. **[F-07]** Make the subscribe response constant-time and constant-shape.
9. **[F-08]** Encrypt `resendApiKey` at rest with a Worker secret.
10. **[F-10]** Rework the invitation flow: token out of the query string, promote only after mailbox proof, add revocation.
11. **[F-11]**, **[F-12]**, **[F-13]**, **[F-14]** — escaping, explicit origin check, zod validation, upload quotas.

**Before public launch:**

12. **[F-16]** Unsubscribe and data-deletion paths — legal blocker.
13. **[F-17]** Audit logging.

---

## Suggested process changes

The critical finding was not a careless mistake — it was a plausible and widely-held misreading of how SvelteKit orders actions and loads. The fix is a check that does not rely on remembering:

- **Code-review checklist rule:** *every `+page.server.ts` action performs its own authorization; a `load` guard never counts.* Add it to `CLAUDE.md`'s Definition of Done.
- **Negative-path E2E tests.** `CLAUDE.md`'s E2E requirements cover "auth protection: unauthenticated users cannot reach the writer dashboard" — but the existing navigation tests only assert on `GET`. Add tests that POST to each privileged action with (a) no session and (b) a reader session, and assert `403`. That test would have caught F-01 on the day it was written.
- **Add a security review gate** to `ci.yml`: a `bun audit` step, and a grep of the built `_worker.js` for `testUtils`.
- **Threat-model the self-hosted deployment specifically.** Several findings here (F-02, F-04, F-08) are low-risk for the maintainer's own instance and materially higher-risk for a self-hoster following the README. Self-hosters are the product's users; their defaults should be the safe ones.
