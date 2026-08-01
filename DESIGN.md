# OpenLetter — Design System

Source of truth for tokens/components is `src/app.css`, ported from the Claude Design handoff project ("OpenLetter publication design system", design system name "Modernist"). This file is a summary, not a duplicate — update `src/app.css` first, then reflect changes here if they affect the system's shape.

## Aesthetic

Editorial, newspaper-like. Warm off-white background, sharp red-orange accent, zero border-radius everywhere (no rounded corners), heavy geometric sans headings. The signature element is a 3px accent-colored rule beneath every publication header — appears on the public site, the writer dashboard, and stand-alone screens (login, welcome) alike.

## Palette

| Token                      | Value                                                        | Use                                                   |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `--color-bg`               | `#f3f2f2`                                                    | Page background                                       |
| `--color-surface`          | `#eae9e9`                                                    | Cards, inputs, dashed upload boxes                    |
| `--color-text`             | `#201e1d`                                                    | Body text                                             |
| `--color-accent`           | `#ec3013` default, **per-publication** — see Personalization | Links, primary buttons, the signature header rule     |
| `--color-divider`          | `color-mix(#201e1d 40%, transparent)`                        | Rules and borders                                     |
| `--color-neutral-100..900` | tonal ramp                                                   | Muted text, backgrounds, borders at varying weights   |
| `--color-accent-100..900`  | `color-mix()` ramp derived from `--color-accent`             | Accent variants (hover/active states, tags)           |
| `--color-on-accent`        | computed per-publication                                     | Text on `--color-accent` backgrounds (`.btn-primary`) |

## Type

- `--font-heading` / `--font-body`: default **Archivo**, but **per-publication** — see Personalization. Weights 400/600/800 loaded via a dynamically-built Google Fonts URL (`src/lib/fonts.ts`), heading weight `800`
- Scale: `h1` 42px → `h6` 13px (uppercase, letter-spaced) — see `src/app.css` for the full ramp
- Headings: negative letter-spacing (`-0.015em` to `-0.04em` depending on size) for the tight editorial look

## Personalization

A writer can set two things in `dashboard/settings`, applied site-wide (public site + dashboard) via inline CSS custom properties set in the root layout (`src/routes/+layout.svelte`):

- **Heading font & body font** — picked from a curated list of 12 Google Fonts (`src/lib/fonts.ts`), not free text. Every entry ships the 400/600/800 weights the system relies on; the fixed list means a submitted value can only ever be one of these exact strings, safe to interpolate into a Google Fonts URL and an inline `style` attribute without separate sanitization.
- **Brand accent color** — any hex color, via a native `<input type="color">`. `--color-accent-100..900` are `color-mix()` expressions derived from `--color-accent` in `src/app.css`, so any accent automatically gets a full tonal ramp. `--color-accent-2` (the system's secondary color) is **not** personalizable.
- **Contrast safety** — `.btn-primary` text defaults to light (`--color-bg`), matching the system's original look. `src/lib/color.ts` only switches to dark text (`--color-text`) when light text would drop below a readability floor (3:1, WCAG's large/bold-text minimum) against the chosen accent — so the shipped default accent (`#ec3013`) keeps its exact original light-text button, while a genuinely pale accent gets dark text automatically. Settings shows the computed contrast ratio and an informational note when it's below full WCAG AA (4.5:1), even though the picked color is always the more-readable option available.

**Deliberately not personalizable:** layout, spacing (`--space-*`), border-radius (`--radius-*`, all `0px`), shadows, and the secondary accent (`--color-accent-2`). A scoped exception to the "no theme marketplace" decision in `PRD.md` §7, not a reversal of it.

## Spacing & radius

- `--space-1` through `--space-8`: 4px/8px/12px/16px/24px/32px
- `--radius-sm/md/lg`: all `0px` — the system deliberately has no rounded corners

## Components (classes in `src/app.css`)

`.btn` / `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-icon` / `.btn-block`, `.input` / `.field`, `.nav` / `.nav-brand`, `.table`, `.tag` / `.tag-accent` / `.tag-neutral` / `.tag-outline`, `.card`, `.dialog` / `.dialog-backdrop`, `.hr`.

Reusable Svelte components in `src/lib/components/`: `PublicNav.svelte`, `AdminNav.svelte`, `SubscribeForm.svelte`, plus small single-purpose icon components in `src/lib/components/icons/`.

## Post editor (Tiptap)

`TiptapEditor.svelte` still keeps the fixed top toolbar (bold/italic/link/heading/image/quote/YouTube/tweet), and adds two Notion-style additions on top of it:

- **Slash ("/") menu** — typing `/` on any line opens a filterable popup (`SlashMenu.svelte`) to insert a block: Heading 2/3, bullet list, numbered list, block quote, code block, divider, image, YouTube, or tweet. Built on `@tiptap/suggestion`; the item list and filtering logic live in `src/lib/tiptap/slash-items.ts`, the ProseMirror plugin glue in `src/lib/tiptap/slash-command.svelte.ts` (a `.svelte.ts` module so its render controller can hold `$state` and imperatively `mount()`/`unmount()` the menu component). Image/YouTube/tweet items reuse the exact same insert flow as their toolbar buttons.
- **Floating bubble menu** — selecting text shows a small floating bold/italic/link/heading toolbar (`BubbleMenu.svelte`) above the selection, positioned off the browser's own `Selection.getRangeAt(0).getBoundingClientRect()` (no extra positioning library).

Deliberately not built this round: drag-handle block reordering/hover controls and a `+`-menu (heavier lift — left for a future session if wanted).

## Screens built (Session 7)

Public: homepage (`/`), post page (`/p/[slug]`).
Writer admin: dashboard overview (`/dashboard`), analytics (`/dashboard/analytics`), post list (`/dashboard/posts`), editor (`/dashboard/posts/new`), settings (`/dashboard/settings`).
Standalone: login (`/login`), check-email (`/login/check-email`), post-deploy welcome (`/welcome`).

All built with mock/hardcoded data (`src/lib/mock-data.ts`) — no backend wiring yet. Not yet designed (per the handoff's own "Next:" notes): 404 page, magic-link/post-delivery email templates, unsubscribe/preferences page.
