import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { generateId } from '../id';

export const publication = sqliteTable('publication', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId('pub')),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	tagline: text('tagline'),
	description: text('description'),
	category: text('category'),
	logoUrl: text('logo_url'),
	// Personalization — accent color + heading/body fonts, editable in
	// dashboard/settings. accentColor is a validated #rrggbb hex (see
	// lib/color.ts); heading/bodyFont are validated against the curated
	// list in lib/fonts.ts. Both validated server-side before this column
	// is ever written, since their values feed directly into an inline
	// style block in the root layout (see +layout.svelte).
	accentColor: text('accent_color').notNull().default('#ec3013'),
	headingFont: text('heading_font').notNull().default('Archivo'),
	bodyFont: text('body_font').notNull().default('Archivo'),
	// Writer-supplied at /setup, editable later in dashboard/settings — never
	// an env var/Cloudflare secret and never returned to the client (see
	// +layout.server.ts and dashboard/settings/+page.server.ts, both of
	// which explicitly select public-safe columns only).
	resendApiKey: text('resend_api_key'),
	resendFromName: text('resend_from_name'),
	resendFromEmail: text('resend_from_email'),
	resendSegmentId: text('resend_segment_id'),
	resendTopicId: text('resend_topic_id'),
	// Signing secret for the webhook the writer manually creates in their
	// Resend dashboard (pointed at /api/webhooks/resend), pasted here like
	// the other Resend fields above — never an env var/Cloudflare secret,
	// never returned to the client. It's what lets the webhook endpoint
	// verify a request actually came from Resend before trusting its
	// open/click event data (see src/lib/server/webhook.ts).
	resendWebhookSecret: text('resend_webhook_secret'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Public API v1 (src/lib/server/api, src/routes/api/v1). Stripe-style:
// named keys, multiple can be active at once (one per integration), revoked
// rather than deleted so past usage stays auditable. Only a SHA-256 hash of
// the raw key is ever stored — the raw key is shown once, at creation time,
// in dashboard/settings, and can't be recovered afterward (only revoked and
// replaced with a new one). lastFour is plaintext-safe (not a secret on its
// own) and exists purely so settings can list "Zapier · ending in ab12"
// without needing the raw key.
export const apiKey = sqliteTable('api_key', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId('key')),
	name: text('name').notNull(),
	hash: text('hash').notNull().unique(),
	lastFour: text('last_four').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
	revokedAt: integer('revoked_at', { mode: 'timestamp' })
});

// Single-row lock claimed atomically by /setup: id's PRIMARY KEY constraint
// means only one concurrent INSERT can ever succeed, regardless of how many
// requests hit /setup at once — this is what actually closes the race, not
// an email check. Deliberately not a column on `publication`, since no
// publication row is ever created before /setup runs (no prior session
// built a "create the publication" flow — dashboard/settings still reads
// from mock data).
export const setupLock = sqliteTable('setup_lock', {
	id: integer('id').primaryKey()
});

export const post = sqliteTable('post', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId('post')),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	subtitle: text('subtitle'),
	excerpt: text('excerpt'),
	body: text('body').notNull(),
	coverImageUrl: text('cover_image_url'),
	// 'subscribers' hides the full body behind SubscribeForm for anyone
	// without a session — a free gate, not a paywall. Paid tiers are
	// explicitly out of v1 scope (PRD.md §7); don't add a 'paywall' value
	// here without that being a deliberate, separate architectural decision
	// (Stripe, billing, webhooks).
	wall: text('wall', { enum: ['public', 'subscribers'] })
		.notNull()
		.default('public'),
	status: text('status', { enum: ['draft', 'published'] })
		.notNull()
		.default('draft'),
	// Scheduling has no dedicated 'scheduled' status or background job — see
	// CLAUDE.md's Known Gotchas. A post is status:'published' with a future
	// publishedAt; every public read filters `publishedAt <= now`, so it's
	// invisible until the moment arrives. Purely a query-time check, no cron.
	publishedAt: integer('published_at', { mode: 'timestamp' }),
	// Set once, right after a real (non-scheduled) publish successfully sends
	// a Resend Broadcast to the segment/topic — see mail.ts's
	// sendPostPublishedBroadcast. Both stay null for drafts, scheduled posts
	// (no send happens until the scheduled time — there's no cron to fire it
	// later, a known gap), and posts published before this column existed.
	resendBroadcastId: text('resend_broadcast_id'),
	// Subscriber count at the moment the broadcast was sent — the
	// denominator for this post's open/click rate in dashboard/analytics,
	// since the live subscriber count drifts after the fact.
	sentCount: integer('sent_count'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const subscriber = sqliteTable('subscriber', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId('sub')),
	email: text('email').notNull().unique(),
	resendContactId: text('resend_contact_id'),
	subscribedAt: integer('subscribed_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	// Set from the webhook's contact.updated event (see
	// src/routes/api/webhooks/resend), not from anything in this app — a
	// reader unsubscribes via Resend's own hosted Topic preference page
	// (PRD.md feature #6), and Resend reports the change back to us. Cleared
	// (set back to null) if the same contact re-subscribes later.
	unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' })
});

// One row per (post, recipient, event type) — inserts use
// onConflictDoNothing() against the unique index below, so a reader opening
// the same email five times only ever produces one row. Real counts (open
// rate, click rate) are COUNT(*) queries against this table, not counters on
// `post`, so a duplicate delivery can never double-count. `delivered` /
// `bounced` / `complained` / `unsubscribed` are populated from
// src/routes/api/webhooks/resend (Resend's own SMTP-layer events, can't be
// self-hosted); `opened` / `clicked` are populated from the first-party
// src/routes/api/track routes instead of Resend's webhook, since we already
// build the email HTML ourselves. recipientEmail is PII — never logged.
export const postEmailEvent = sqliteTable(
	'post_email_event',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => generateId('pev')),
		// Nullable: 'unsubscribed' events have no post to attach to — Resend's
		// contact.updated webhook carries no broadcast_id (see CLAUDE.md's
		// Known Gotchas), so an unsubscribe is a publication-level timeline
		// entry, not a per-post stat.
		postId: text('post_id').references(() => post.id, { onDelete: 'cascade' }),
		type: text('type', {
			enum: ['delivered', 'opened', 'clicked', 'unsubscribed', 'complained', 'bounced']
		}).notNull(),
		recipientEmail: text('recipient_email').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex('post_email_event_unique').on(table.postId, table.type, table.recipientEmail),
		index('post_email_event_post_idx').on(table.postId)
	]
);

// Better Auth's own tables, generated via `better-auth generate` against the
// magicLink plugin, then folded in here. IDs are assigned by Better Auth's
// `generateId` hook (see src/lib/server/auth.ts), not by a column default —
// unlike the app's own tables above, Better Auth controls the insert.
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
	role: text('role', { enum: ['admin', 'reader'] })
		.notNull()
		.default('reader'),
	firstName: text('first_name'),
	lastName: text('last_name')
});

export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const invitation = sqliteTable('invitation', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId('inv')),
	email: text('email').notNull(),
	invitedByUserId: text('invited_by_user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	status: text('status', { enum: ['pending', 'accepted', 'revoked'] })
		.notNull()
		.default('pending'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	acceptedAt: integer('accepted_at', { mode: 'timestamp' })
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}));
