CREATE TABLE `review_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`isAuthorReply` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reviews` ADD `replyCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_reviewId_reviews_id_fk` FOREIGN KEY (`reviewId`) REFERENCES `reviews`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_replies` ADD CONSTRAINT `review_replies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `review_idx` ON `review_replies` (`reviewId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `review_replies` (`userId`);