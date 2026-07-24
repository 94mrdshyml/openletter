# OpenLetter — Product Requirements Document (v1)

## 1. Summary

OpenLetter is an open source, self-hosted alternative to Substack. A writer runs one CLI command against their own Cloudflare account and gets a working publication: a public site, a post editor, and email delivery to subscribers — with no server to provision by hand and no third-party platform owning the relationship with readers.

## 2. Problem & Positioning

Substack charges a revenue cut, owns the subscriber relationship, and increasingly pushes writers toward its social feed (Notes) rather than a clean publication. Ghost is the existing open-source alternative, and it is mature — themes, paid memberships, Stripe billing, a plugin ecosystem — but self-hosting it means running a VPS, a database, and ongoing ops.

**OpenLetter's wedge is not feature parity with Ghost. It's deployment friction.** The bet: most people who'd self-host a newsletter platform are blocked by "I don't want to manage a server," not by "I need a theme marketplace." One CLI command, entirely on Cloudflare's free/cheap tier, removes that blocker.

Non-goal: out-competing Ghost on feature depth in v1. That is a multi-year gap and trying to close it immediately delays shipping the one thing nobody else offers.

## 3. Users

- **Writer** — runs the CLI, owns a publication, writes and publishes posts, sees subscriber count.
- **Reader** — subscribes with an email address, reads posts on the web or in their inbox, controls their own subscription preferences.

v1 assumes **one writer per deployed instance** (no team/multi-author permissions model yet).

## 4. Technical Architecture (decided)

| Layer          | Choice                           | Why                                                                                                                                                                                                          |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Compute        | Cloudflare Workers               | Native deploy target for the rest of the stack; Wrangler unifies deploy + D1 migrations + R2 provisioning in one CLI.                                                                                        |
| Framework      | SvelteKit (`adapter-cloudflare`) | Tier-1 support on Workers without an adapter-translation layer; one framework covers both the public site (SSR content) and the writer dashboard (forms, auth, app state).                                   |
| Database       | Cloudflare D1 (via Drizzle)      | Same pattern as the team's existing Open Tabs stack.                                                                                                                                                         |
| Object storage | Cloudflare R2                    | Images/attachments.                                                                                                                                                                                          |
| Email          | Resend                           | Single hardcoded provider, API-key setup only. Uses **Segments** (internal grouping, for targeting sends) and **Topics** (reader-facing preference categories) — not Audiences, which Resend has deprecated. |
| Auth (reader)  | Better Auth, `magicLink` plugin  | Runs inside the app against D1 — no third external vendor account required for self-hosters. `sendMagicLink` calls Resend directly.                                                                          |
| CLI            | Custom, built on Wrangler        | Provisions Worker, D1 database + migrations, R2 bucket, and prompts for the two required secrets (Resend API key, Better Auth secret).                                                                       |

Two implementation notes carried over from stack discussion:

- D1 bindings aren't available at module load time in Workers — Better Auth must be instantiated per-request (e.g. `auth.with(d1Database)`), not at top-level scope.
- The Better Auth catch-all route (`/api/auth/[...betterauth]`) must be defined explicitly in SvelteKit, since Wrangler pre-computes route paths at build time.

## 5. Core User Flows

**Writer: publish loop**

1. Write/edit a post in the editor (draft state).
2. Hit Publish.
3. Post becomes a public web page + appears on the publication homepage + RSS feed.
4. Post is sent as an email to the relevant Resend Segment/Topic.

**Reader: subscribe loop**

1. Enter email on the publication page.
2. Better Auth sends a magic link via Resend.
3. Clicking the link creates the session and adds the contact to the publication's Resend Segment (and Topic, if the publication has more than one newsletter category).
4. Reader receives future posts by email and can manage preferences via the Resend-hosted Topic preference page.

## 6. V1 Feature Requirements

| #   | Feature                 | Requirement                                                                                                                                     |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Publication setup       | Name, slug/subdomain, single logo field. No theme customization in v1.                                                                          |
| 2   | Post editor             | Tiptap-based, draft and publish states.                                                                                                         |
| 3   | Public site             | Individual post pages, publication homepage (post list), RSS feed.                                                                              |
| 4   | Subscribe flow          | Email capture → Better Auth magic link → Resend Segment/Topic membership.                                                                       |
| 5   | Publish → email         | Publishing a post triggers a send to the associated Segment/Topic via Resend.                                                                   |
| 6   | Unsubscribe/preferences | Reader-facing link into Resend's Topic preference page.                                                                                         |
| 7   | Writer dashboard        | Subscriber count, post list, open/click stats sourced directly from Resend's own analytics (no custom tracking build).                          |
| 8   | CLI deploy              | One command: provisions Worker, D1 (+ migrations), R2 bucket; prompts for Resend API key and Better Auth secret; ends in a working publication. |

## 7. Explicitly Out of Scope for V1

- **Paid subscriptions / Stripe billing** — significant scope (webhooks, tiers, proration, dunning); Ghost's established home turf, not needed to validate the core loop.
- **Custom themes / theme marketplace** — Ghost's moat; revisit post-v1.
- **Comments** — moderation and spam handling is its own workstream.
- **Multi-author / team publications** — needs a permissions model; single-writer-per-instance is an acceptable v1 constraint.
- **Custom analytics** — Resend's built-in metrics are sufficient for now.

## 8. V1.1 Fast Follow (highest leverage, deliberately not in v1)

**Substack import** (posts + subscriber list). This is the single most likely driver of adoption — the actual blocker keeping people on Substack despite dissatisfaction is fear of losing their list, and it's why Ghost ships migration tooling as a first-class feature. It's sequenced after v1 because it depends on the core publish/subscribe loop already existing and working.

## 9. Success Criteria for V1

- A new user can go from `npx <cli>` to a live, working publication (their own domain/subdomain, on their own Cloudflare account) without touching the Cloudflare dashboard directly.
- A writer can publish a post and have it appear on the web and in a test subscriber's inbox within the same flow.
- A reader can subscribe, receive a post, and unsubscribe (or change Topic preferences) without writer intervention.

## 10. Open Questions

- Custom domain support in v1, or subdomain-only (e.g. `*.workers.dev`) until v1.1?
- What's the minimum viable writer dashboard — is a raw subscriber count enough, or does open/click data need to be visible in v1 for the dashboard to feel credible?

**Resolved:** Single Topic per publication by default, not multiple newsletter categories — matches the deployment-friction wedge (§2), since prompting writers to define categories at setup is exactly the kind of configuration surface OpenLetter is meant to remove. One Resend Segment ("Subscribers") and one Topic ("Newsletter") are created per publication, once, in `/setup`. See `src/lib/server/resend.ts`.
