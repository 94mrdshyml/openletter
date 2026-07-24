import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
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
	resendSegmentId: text('resend_segment_id'),
	resendTopicId: text('resend_topic_id'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
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
	excerpt: text('excerpt'),
	body: text('body').notNull(),
	status: text('status', { enum: ['draft', 'published'] })
		.notNull()
		.default('draft'),
	publishedAt: integer('published_at', { mode: 'timestamp' }),
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
		.$defaultFn(() => new Date())
});

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
