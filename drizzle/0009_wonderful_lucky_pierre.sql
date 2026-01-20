CREATE TABLE `tour_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tourId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tour_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tour_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tourId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tour_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD `price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `tour_comments` ADD CONSTRAINT `tour_comments_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tour_comments` ADD CONSTRAINT `tour_comments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tour_ratings` ADD CONSTRAINT `tour_ratings_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tour_ratings` ADD CONSTRAINT `tour_ratings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;