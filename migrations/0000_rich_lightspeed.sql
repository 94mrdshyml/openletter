CREATE TABLE `post` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_slug_unique` ON `post` (`slug`);--> statement-breakpoint
CREATE TABLE `publication` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`tagline` text,
	`description` text,
	`logo_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_slug_unique` ON `publication` (`slug`);--> statement-breakpoint
CREATE TABLE `subscriber` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`resend_contact_id` text,
	`subscribed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriber_email_unique` ON `subscriber` (`email`);