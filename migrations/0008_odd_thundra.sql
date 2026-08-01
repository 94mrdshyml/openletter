CREATE TABLE `post_email_event` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`type` text NOT NULL,
	`recipient_email` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_email_event_unique` ON `post_email_event` (`post_id`,`type`,`recipient_email`);--> statement-breakpoint
CREATE INDEX `post_email_event_post_idx` ON `post_email_event` (`post_id`);--> statement-breakpoint
ALTER TABLE `post` ADD `resend_broadcast_id` text;--> statement-breakpoint
ALTER TABLE `post` ADD `sent_count` integer;--> statement-breakpoint
ALTER TABLE `publication` ADD `resend_webhook_secret` text;