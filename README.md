# OpenLetter

**An open source, self-hosted alternative to Substack.** Run one CLI command against your own Cloudflare account and get a working publication: a public site, a post editor, and email delivery to subscribers — no server to provision by hand, no third-party platform owning the relationship with your readers.

```sh
git clone https://github.com/94mrdshyml/openletter.git
cd openletter/cli && bun install
bun bin/openletter.ts create
```

That's it — a live publication, deployed on your own Cloudflare account. See [`cli/README.md`](cli/README.md) for the full command reference.

## Why

Substack takes a revenue cut, owns the subscriber relationship, and increasingly pushes writers toward its social feed rather than a clean publication. Ghost is the established open-source alternative — themes, paid memberships, a plugin ecosystem — but self-hosting it means running a VPS, a database, and ongoing ops.

OpenLetter's bet: most people who'd self-host a newsletter platform are blocked by "I don't want to manage a server," not by "I need a theme marketplace." One CLI command, entirely on Cloudflare's free/cheap tier, removes that blocker. It is not trying to out-feature Ghost — it's trying to remove the one thing standing between "I want to own my publication" and actually doing it.

## Key features

- **One-command deploy** — the CLI provisions a Cloudflare Worker, a D1 database (with migrations applied), and an R2 bucket for media, and generates your auth secret. No manual Cloudflare dashboard work.
- **Post editor** — a Notion-style Tiptap editor: slash-command block menu, floating selection toolbar, image/YouTube/tweet embeds, draft and publish states.
- **Public site** — an editorial, newspaper-style publication homepage, individual post pages, and an RSS feed, out of the box.
- **Publish → email** — publishing a post sends the full content (not a teaser) to every subscriber via Resend, immediately.
- **Subscribe & unsubscribe** — email capture backed by Better Auth magic links, and a branded `/unsubscribe` page rather than a third-party hosted preference page.
- **Reader analytics** — subscriber counts, and real open/click stats sourced from Resend's webhook events (`email.opened` / `email.clicked`), not a custom tracking pixel.
- **Personalization** — brand accent color and heading/body fonts, picked from a curated list, applied consistently across the site and every email — a scoped exception to "no theme marketplace," not a reversal of it.
- **You own everything** — your own Cloudflare account, your own D1 database, your own Resend account. No OpenLetter-run service sits between you and your readers.

## Tech stack

| Layer           | Choice                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Compute         | Cloudflare Workers                                                                                   |
| Framework       | SvelteKit (`adapter-cloudflare`)                                                                     |
| Database        | Cloudflare D1, via Drizzle ORM                                                                       |
| Object storage  | Cloudflare R2 (images/attachments)                                                                   |
| Email           | [Resend](https://resend.com) — Segments for internal targeting, Topics for reader-facing preferences |
| Auth (reader)   | Better Auth, `magicLink` plugin, running against D1                                                  |
| Editor          | Tiptap                                                                                               |
| CLI             | Custom, built on Wrangler                                                                            |
| Package manager | [Bun](https://bun.sh)                                                                                |
| Testing         | Vitest (unit/integration), Playwright (E2E)                                                          |

## Project structure

```
openletter/
├── cli/            # `openletter` CLI — scaffolds, provisions, and deploys a publication
├── src/
│   ├── routes/      # SvelteKit routes: public site, writer dashboard, auth, API/webhooks
│   └── lib/
│       ├── components/  # UI components (editor, nav, icons, forms)
│       ├── server/      # DB access, auth, email, media, ID generation
│       └── tiptap/      # Editor extensions (slash menu, tweet embed, etc.)
├── migrations/      # D1 schema migrations (Drizzle)
├── docs/            # Session log, security audit
├── PRD.md           # Product requirements
├── DESIGN.md        # Design system reference
└── CLAUDE.md         # Engineering conventions and process for this repo
```

## Development

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev          # start the dev server
bun run dev -- --open
```

Copy `.dev.vars.example` to `.dev.vars` and fill in a `BETTER_AUTH_SECRET` (e.g. `openssl rand -hex 32`) before running locally.

```sh
bun run build         # production build
bun run preview        # preview the production build
bun run check          # typecheck (svelte-check)
bun run lint           # prettier + eslint
bun run test:unit -- --run   # unit/integration tests (Vitest)
bun run test:e2e             # end-to-end tests (Playwright)
```

## Documentation

- [`cli/README.md`](cli/README.md) — full CLI command reference and troubleshooting
- [`PRD.md`](PRD.md) — product requirements: user flows, feature scope, open questions
- [`DESIGN.md`](DESIGN.md) — design system: palette, type, personalization, components
- [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md) — security review findings and status
- [`CLAUDE.md`](CLAUDE.md) — engineering conventions for contributors

## Status

OpenLetter is early and under active development. The core loop — deploy, write, publish, subscribe, receive email, unsubscribe — works end to end. Not yet built: paid subscriptions, custom themes beyond accent/font personalization, multi-author publications, and Substack import (see `PRD.md` §7–8 for the full scope boundaries).

## License

MIT
