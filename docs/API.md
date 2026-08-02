# OpenLetter API v1

A small REST API for scripting against your publication — external signup forms, migration scripts, integrations. Every endpoint lives under `/api/v1` and requires an API key.

## Authentication

Generate a key in `dashboard/settings` → **API keys** → "Create key". The raw key (`ol_…`) is shown once, at creation time — copy it then, it can't be recovered afterward (only revoked and replaced). You can create multiple named keys (e.g. one per integration) and revoke any of them independently.

Send it as a Bearer token on every request:

```
Authorization: Bearer ol_<your key>
```

Requests with a missing, malformed, or revoked key get `401 { "error": "..." }`.

There is no per-key scoping in v1 — any valid key can do everything below. There is also no rate limiting yet — a known gap, not a design decision (see `docs/SESSION_LOG.md` Session 23).

## Subscribers

### `GET /api/v1/subscribers`

List subscribers, newest first.

Query params: `limit` (default 50, max 200), `offset` (default 0).

```json
{
	"data": [
		{
			"id": "sub_...",
			"email": "reader@example.com",
			"subscribedAt": "...",
			"unsubscribedAt": null
		}
	],
	"limit": 50,
	"offset": 0,
	"total": 123
}
```

### `POST /api/v1/subscribers`

Add a subscriber directly — no magic-link email is sent, no clicking required. Adds them straight to Resend's configured Segment/Topic, same as a real subscribe.

```json
{ "email": "reader@example.com" }
```

`201` with the created (or already-existing — this is idempotent) subscriber. `400` if the email is malformed.

### `PATCH /api/v1/subscribers/:id`

The only supported update — unsubscribe:

```json
{ "unsubscribed": true }
```

`200 { "ok": true, "unsubscribedAt": "..." }` on success. `ok` can be `false` if the underlying Resend call fails — this endpoint reports the real outcome rather than a fake success, since the actual send list lives in Resend, not this response. `404` if the id doesn't exist. Re-subscribing isn't supported here — it only ever happens through the real subscribe flow.

## Posts

Both endpoints return full post content regardless of the post's `wall` setting — an API key represents you, the writer, not an anonymous reader, so the subscriber-only gate that hides body content on the public site doesn't apply here. Only published, publicly-visible posts are ever returned (drafts and posts scheduled for the future 404 / are excluded).

### `GET /api/v1/posts`

List published posts, newest first. Same `limit`/`offset`/response shape as subscribers above.

### `GET /api/v1/posts/:slug`

A single published post. `404` if the slug doesn't exist, is a draft, or is scheduled for a future date.

## Example

```sh
curl -X POST https://your-publication.example.com/api/v1/subscribers \
  -H "Authorization: Bearer ol_..." \
  -H "Content-Type: application/json" \
  -d '{"email":"reader@example.com"}'
```
