CREATE TABLE `scrape_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` text NOT NULL,
	`agencyId` int,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`toursFound` int NOT NULL DEFAULT 0,
	`toursImported` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`rawData` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `scrape_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD CONSTRAINT `scrape_jobs_agencyId_agencies_id_fk` FOREIGN KEY (`agencyId`) REFERENCES `agencies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD CONSTRAINT `scrape_jobs_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;