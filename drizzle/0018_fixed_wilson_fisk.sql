CREATE TABLE `ad_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advertisementId` int NOT NULL,
	`eventType` enum('impression','click') NOT NULL,
	`userId` int,
	`sessionId` varchar(255),
	`ipAddress` varchar(45),
	`userAgent` text,
	`referrer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ad_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `advertisements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('tour','agency') NOT NULL,
	`tourId` int,
	`agencyId` int,
	`placement` enum('home_featured','search_top','sidebar') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`budget` decimal(10,2),
	`costPerClick` decimal(10,2),
	`costPerImpression` decimal(10,2),
	`status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advertisements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ad_tracking` ADD CONSTRAINT `ad_tracking_advertisementId_advertisements_id_fk` FOREIGN KEY (`advertisementId`) REFERENCES `advertisements`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ad_tracking` ADD CONSTRAINT `ad_tracking_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `advertisements` ADD CONSTRAINT `advertisements_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `advertisements` ADD CONSTRAINT `advertisements_agencyId_agencies_id_fk` FOREIGN KEY (`agencyId`) REFERENCES `agencies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ad_idx` ON `ad_tracking` (`advertisementId`);--> statement-breakpoint
CREATE INDEX `event_type_idx` ON `ad_tracking` (`eventType`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `ad_tracking` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `advertisements` (`tourId`);--> statement-breakpoint
CREATE INDEX `agency_idx` ON `advertisements` (`agencyId`);--> statement-breakpoint
CREATE INDEX `placement_idx` ON `advertisements` (`placement`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `advertisements` (`status`);