import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { generateId } from '../id';

export const publication = sqliteTable('publication', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => generateId('pub')),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	tagline: text('tagline'),
	description: text('description'),
	logoUrl: text('logo_url'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
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
