# OpenLetter — Design System

Source of truth for tokens/components is `src/app.css`, ported from the Claude Design handoff project ("OpenLetter publication design system", design system name "Modernist"). This file is a summary, not a duplicate — update `src/app.css` first, then reflect changes here if they affect the system's shape.

## Aesthetic

Editorial, newspaper-like. Warm off-white background, sharp red-orange accent, zero border-radius everywhere (no rounded corners), heavy geometric sans headings. The signature element is a 3px accent-colored rule beneath every publication header — appears on the public site, the writer dashboard, and stand-alone screens (login, welcome) alike.

## Palette

| Token                      | Value                                 | Use                                                 |
| -------------------------- | ------------------------------------- | --------------------------------------------------- |
| `--color-bg`               | `#f3f2f2`                             | Page background                                     |
| `--color-surface`          | `#eae9e9`                             | Cards, inputs, dashed upload boxes                  |
| `--color-text`             | `#201e1d`                             | Body text                                           |
| `--color-accent`           | `#ec3013`                             | Links, primary buttons, the signature header rule   |
| `--color-divider`          | `color-mix(#201e1d 40%, transparent)` | Rules and borders                                   |
| `--color-neutral-100..900` | tonal ramp                            | Muted text, backgrounds, borders at varying weights |
| `--color-accent-100..900`  | tonal ramp                            | Accent variants (hover/active states, tags)         |

## Type

- `--font-heading` / `--font-body`: both **Archivo** (weights 400/600/800 loaded via Google Fonts in `src/app.html`), heading weight `800`
- Scale: `h1` 42px → `h6` 13px (uppercase, letter-spaced) — see `src/app.css` for the full ramp
- Headings: negative letter-spacing (`-0.015em` to `-0.04em` depending on size) for the tight editorial look

## Spacing & radius

- `--space-1` through `--space-8`: 4px/8px/12px/16px/24px/32px
- `--radius-sm/md/lg`: all `0px` — the system deliberately has no rounded corners

## Components (classes in `src/app.css`)

`.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-icon` / `.btn-block`, `.input` / `.field`, `.nav` / `.nav-brand`, `.table`, `.tag` / `.tag-accent` / `.tag-neutral` / `.tag-outline`, `.card`, `.dialog` / `.dialog-backdrop`, `.hr`.

Reusable Svelte components in `src/lib/components/`: `PublicNav.svelte`, `AdminNav.svelte`, `SubscribeForm.svelte`, plus small single-purpose icon components in `src/lib/components/icons/`.

## Screens built (Session 7)

Public: homepage (`/`), post page (`/p/[slug]`).
Writer admin: dashboard overview (`/dashboard`), analytics (`/dashboard/analytics`), post list (`/dashboard/posts`), editor (`/dashboard/posts/new`), settings (`/dashboard/settings`).
Standalone: login (`/login`), check-email (`/login/check-email`), post-deploy welcome (`/welcome`).

All built with mock/hardcoded data (`src/lib/mock-data.ts`) — no backend wiring yet. Not yet designed (per the handoff's own "Next:" notes): 404 page, magic-link/post-delivery email templates, unsubscribe/preferences page.
