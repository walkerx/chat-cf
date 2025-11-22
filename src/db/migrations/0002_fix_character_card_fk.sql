-- Fix foreign key constraint for character_card_id
-- SQLite doesn't support ALTER COLUMN, so we need to:
-- 1. Create a new table with correct constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- Create new conversations table with correct foreign key
CREATE TABLE `conversations_new` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`title` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`character_card_id` text,
	`compiled_context` text,
	FOREIGN KEY (`session_id`) REFERENCES `client_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_card_id`) REFERENCES `character_cards`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint

-- Copy data from old table
INSERT INTO `conversations_new` SELECT * FROM `conversations`;
--> statement-breakpoint

-- Drop old table
DROP TABLE `conversations`;
--> statement-breakpoint

-- Rename new table
ALTER TABLE `conversations_new` RENAME TO `conversations`;
--> statement-breakpoint

-- Recreate indexes
CREATE INDEX `idx_conv_session_updated` ON `conversations` (`session_id`,`updated_at` desc);
--> statement-breakpoint
CREATE INDEX `idx_conv_updated` ON `conversations` (`updated_at` desc);
