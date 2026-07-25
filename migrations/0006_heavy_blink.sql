ALTER TABLE `post` ADD `subtitle` text;--> statement-breakpoint
ALTER TABLE `post` ADD `cover_image_url` text;--> statement-breakpoint
ALTER TABLE `post` ADD `wall` text DEFAULT 'public' NOT NULL;