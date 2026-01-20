ALTER TABLE `notifications` MODIFY COLUMN `reviewId` int;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `replyId` int;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `fromUserId` int;--> statement-breakpoint
ALTER TABLE `notifications` ADD `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `content` text NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `relatedId` int;