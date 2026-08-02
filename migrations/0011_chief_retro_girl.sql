PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_post_email_event` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text,
	`type` text NOT NULL,
	`recipient_email` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_email_event`("id", "post_id", "type", "recipient_email", "created_at") SELECT "id", "post_id", "type", "recipient_email", "created_at" FROM `post_email_event`;--> statement-breakpoint
DROP TABLE `post_email_event`;--> statement-breakpoint
ALTER TABLE `__new_post_email_event` RENAME TO `post_email_event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `post_email_event_unique` ON `post_email_event` (`post_id`,`type`,`recipient_email`);--> statement-breakpoint
CREATE INDEX `post_email_event_post_idx` ON `post_email_event` (`post_id`);