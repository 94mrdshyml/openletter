# `openletter` CLI

Scaffold, provision, and deploy a self-hosted [OpenLetter](https://github.com/94mrdshyml/openletter) publication on Cloudflare — one command, no server to manage by hand.

## Prerequisites

- [Bun](https://bun.sh) installed (`bun --version`) — the CLI runs on Bun, not Node
- [Git](https://git-scm.com/)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is enough)

You do **not** need to install `wrangler` yourself — it's a dependency of the scaffolded project and the CLI calls it via `bunx`.

## Install

The CLI isn't published to npm yet. Until then, run it straight from the repo:

```sh
git clone https://github.com/94mrdshyml/openletter.git
cd openletter/cli
bun install
bun bin/openletter.ts create
```

Once published, the same command will be:

```sh
bunx openletter create
```

## Commands

### `openletter create [name]`

The one-command flow described in `PRD.md` §8. Does everything needed to go from nothing to a live publication:

1. Clones the OpenLetter repo into `./<name>` (stripped of `.git` and the `cli/` folder — your copy is a fresh repo, not the CLI's own source)
2. `bun install`
3. Checks you're logged in to Cloudflare (`wrangler whoami`), and runs `wrangler login` if not
4. Resets `wrangler.jsonc` for your publication — sets the Worker name, clears the template's own D1/R2 bindings
5. Creates a D1 database and binds it (`wrangler d1 create --update-config`)
6. Applies all database migrations (`wrangler d1 migrations apply --remote`)
7. Creates an R2 bucket for media and binds it
8. Enables the bucket's public `r2.dev` URL and writes it into `wrangler.jsonc` as `MEDIA_PUBLIC_URL`
9. Generates a random `BETTER_AUTH_SECRET` and sets it as a Worker secret (`wrangler secret put`) — this value is never shown or stored anywhere by the CLI
10. Deploys (`wrangler deploy`)

If `name` is omitted, you'll be prompted for a publication name. The name is slugified into the Worker name, D1 database name, and R2 bucket name (e.g. "My Newsletter" → `my-newsletter`).

**After `create` finishes:** open your Worker's URL + `/setup` in a browser to create the admin account and add your Resend API key. Resend configuration lives in the app's database, not in the CLI or in any env var — see the "Known Gotchas" section of the main `CLAUDE.md` for why.

### `openletter deploy`

Run from inside an existing scaffolded project. Applies any pending D1 migrations, then `wrangler deploy`s. This is what you run after pulling new commits or making local changes — it does not touch D1/R2 provisioning.

### `openletter d1 create [name]`

Standalone D1 provisioning: creates a database, binds it in `wrangler.jsonc`, and applies migrations. Defaults `name` to the Worker's own name in `wrangler.jsonc`. Useful for re-running provisioning if `create` failed partway through, or for setting up D1 by hand.

### `openletter r2 create [name]`

Standalone R2 provisioning: creates a bucket (default name `openletter-media`), binds it, enables its public `r2.dev` URL, and writes `MEDIA_PUBLIC_URL` into `wrangler.jsonc`.

### `openletter secrets set [name]`

Sets a Worker secret via `wrangler secret put`. Defaults to `BETTER_AUTH_SECRET`.

- `openletter secrets set` — generates nothing by default; prompts for the value (hidden input)
- `openletter secrets set --generate` — generates a random 32-byte hex value instead of prompting (what `create` uses internally for `BETTER_AUTH_SECRET`)
- `openletter secrets set MY_OTHER_SECRET` — set any other Worker secret by name

## How it works

Every command shells out to the `wrangler` binary already installed as a devDependency of the scaffolded project (`bunx wrangler ...`) — this CLI has no direct Cloudflare API integration and no separate auth mechanism. Whatever account `wrangler login` is authenticated against is the account commands run against. See `src/lib/wrangler.ts`.

`wrangler.jsonc` is read and written as plain JSON (`src/lib/config.ts`) — the file has no `//` comments today, so this is safe. If comments are ever added to the template's `wrangler.jsonc`, this needs to switch to a comment-preserving parser instead of `JSON.parse`/`JSON.stringify`.

## Troubleshooting

- **`create` fails partway through** — resources already created (D1, R2) are not rolled back. Re-run the specific granular command (`openletter d1 create`, `openletter r2 create`, `openletter secrets set --generate`) for whichever step failed, then `openletter deploy`.
- **"already exists" from `wrangler d1 create` / `r2 bucket create`** — you're re-running `create` after a partial failure and the resource is already there. Cloudflare resource names must be unique per account; either delete the old resource in the dashboard or pick a different publication name.
- **Not logged in** — any command will trigger `wrangler login` automatically (opens a browser). Run `bunx wrangler whoami` yourself if you want to check first.
