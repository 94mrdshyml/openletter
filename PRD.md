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
4. Post is sent as an email to the relevant Resend Segment/Topic — the full post content (not a teaser-and-link), immediately, for a real ("Publish now") publish. A "Schedule for later" post does **not** currently send an email: there's no cron trigger to fire it when the scheduled time arrives (see §10).

**Reader: subscribe loop**

1. Enter email on the publication page.
2. Better Auth sends a magic link via Resend.
3. Clicking the link creates the session and adds the contact to the publication's Resend Segment (and Topic, if the publication has more than one newsletter category).
4. Reader receives future posts by email and can unsubscribe via OpenLetter's own branded `/unsubscribe` page (not Resend's hosted Topic preference page — see feature #6).

## 6. V1 Feature Requirements

| #   | Feature                 | Requirement                                                                                                                                                                                                                                                                      |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Publication setup       | Name, slug/subdomain, single logo field.                                                                                                                                                                                                                                         |
| 2   | Post editor             | Tiptap-based, draft and publish states.                                                                                                                                                                                                                                          |
| 3   | Public site             | Individual post pages, publication homepage (post list), RSS feed.                                                                                                                                                                                                               |
| 4   | Subscribe flow          | Email capture → Better Auth magic link → Resend Segment/Topic membership.                                                                                                                                                                                                        |
| 5   | Publish → email         | Publishing a post triggers a send to the associated Segment/Topic via Resend.                                                                                                                                                                                                    |
| 6   | Unsubscribe/preferences | Own branded page (`/unsubscribe`), not Resend-hosted — every send footer links here with `{{{contact.email}}}` pre-filled; confirming calls Resend's contact-topics API (`PATCH /contacts/{email}/topics`, opt_out) directly.                                                    |
| 7   | Writer dashboard        | Subscriber count, post list, open/click stats sourced directly from Resend's own analytics (no custom tracking build).<sup>†</sup> Full subscriber list (`dashboard/subscribers`): email, subscribed date, newsletters received, opens, clicks, unsubscribed date if applicable. |
| 8   | CLI deploy              | One command: provisions Worker, D1 (+ migrations), R2 bucket; prompts for Resend API key and Better Auth secret; ends in a working publication.                                                                                                                                  |
| 9   | Personalization         | Brand accent color and heading/body fonts (curated Google Fonts list), editable in `dashboard/settings`. See §7 for what this deliberately excludes.                                                                                                                             |

<sup>†</sup> Resend's Broadcast API returns zero engagement fields on create/get/list (checked directly against their API reference) — open/click counts only exist as `email.opened`/`email.clicked` webhook events. "No custom tracking build" means OpenLetter never runs its own open-pixel or link-rewriting — Resend's own mechanism does that — but a webhook receiver (`/api/webhooks/resend`, signature-verified) and a small event table are required to durably record what Resend reports. See `src/lib/server/webhook.ts` and `docs/SESSION_LOG.md` Session 19.

## 7. Explicitly Out of Scope for V1

- **Paid subscriptions / Stripe billing** — significant scope (webhooks, tiers, proration, dunning); Ghost's established home turf, not needed to validate the core loop.
- **Custom themes / theme marketplace** — Ghost's moat; revisit post-v1. **Narrowed, not reversed, by feature #9 above:** brand accent color and heading/body font are now personalizable (a deliberate, scoped exception — see DESIGN.md), but layout, spacing, border-radius, and arbitrary CSS remain fixed. The wedge is still "one opinionated design system," not a theme editor — a publication can look like itself, not like anything a writer imagines.
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
- **Scheduled posts don't send an email.** "Schedule for later" (the post editor's publish dialog) sets a future `publishedAt` and relies purely on query-time filtering for public visibility — there's no cron trigger anywhere in the app. Publishing itself now sends immediately for a real ("Publish now") publish, but a scheduled post's eventual becoming-visible moment has no corresponding event to fire the email from. Fixing this needs a Cloudflare Cron Trigger + `scheduled()` handler, deliberately out of scope for the session that added the send pipeline (see `docs/SESSION_LOG.md` Session 19) — a future session's job if this gap matters enough.

**Resolved:** Single Topic per publication by default, not multiple newsletter categories — matches the deployment-friction wedge (§2), since prompting writers to define categories at setup is exactly the kind of configuration surface OpenLetter is meant to remove. The writer supplies their own Resend API key, from name/email, and Segment id as part of `/setup` (editable later in `dashboard/settings`) — not env vars, not auto-created by the app. The Topic ("Newsletter") is the one exception: it's auto-created once, during `/setup`, since Topics (unlike Segments) aren't capped by Resend's plan. See `src/lib/server/resend.ts` and `src/lib/server/mail.ts`. Writer dashboard open/click stats: resolved as real, via a Resend webhook (`/api/webhooks/resend`) recording `email.opened`/`email.clicked` events — see feature #7's footnote above.
