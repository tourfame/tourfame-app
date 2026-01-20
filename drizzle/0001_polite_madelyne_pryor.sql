CREATE TABLE `affiliate_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tourId` int NOT NULL,
	`userId` int,
	`sessionId` varchar(255),
	`ipAddress` varchar(45),
	`userAgent` text,
	`referrer` text,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_conversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clickId` int,
	`tourId` int NOT NULL,
	`userId` int,
	`conversionType` enum('cpa','cps') NOT NULL,
	`commissionAmount` decimal(10,2),
	`orderValue` decimal(10,2),
	`status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
	`convertedAt` timestamp NOT NULL DEFAULT (now()),
	`confirmedAt` timestamp,
	CONSTRAINT `affiliate_conversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`logo` text,
	`website` text,
	`phone` varchar(50),
	`email` varchar(320),
	`rating` decimal(3,2) DEFAULT '0',
	`reviewCount` int NOT NULL DEFAULT 0,
	`affiliateUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`upvoteCount` int NOT NULL DEFAULT 0,
	`isAccepted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tourId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_watches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tourId` int NOT NULL,
	`targetPrice` decimal(10,2),
	`notifyOnAnyDrop` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_watches_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_tour_unique` UNIQUE(`userId`,`tourId`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tourId` int,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`answerCount` int NOT NULL DEFAULT 0,
	`upvoteCount` int NOT NULL DEFAULT 0,
	`hasAcceptedAnswer` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tourId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(255),
	`content` text NOT NULL,
	`photos` text,
	`isVerified` boolean NOT NULL DEFAULT false,
	`verificationMethod` varchar(100),
	`travelDate` timestamp,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('feature','quality','service','value') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tour_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tourId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tour_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tour_tag_unique` UNIQUE(`tourId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `tours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agencyId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`destination` varchar(255) NOT NULL,
	`days` int NOT NULL,
	`nights` int NOT NULL,
	`tourType` enum('pure_play','luxury','cruise','budget','family') NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`originalPrice` decimal(10,2),
	`currency` varchar(10) NOT NULL DEFAULT 'HKD',
	`departureDate` timestamp NOT NULL,
	`returnDate` timestamp NOT NULL,
	`availableSeats` int NOT NULL DEFAULT 0,
	`minGroupSize` int NOT NULL DEFAULT 1,
	`itinerary` text NOT NULL,
	`highlights` text,
	`inclusions` text,
	`exclusions` text,
	`optionalActivities` text,
	`hotels` text,
	`meals` text,
	`transportation` text,
	`tourGuideLanguage` varchar(100),
	`isNoShopping` boolean NOT NULL DEFAULT false,
	`isVerified` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`bookingCount` int NOT NULL DEFAULT 0,
	`rating` decimal(3,2) DEFAULT '0',
	`reviewCount` int NOT NULL DEFAULT 0,
	`affiliateLink` text NOT NULL,
	`status` enum('active','sold_out','cancelled','draft') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `view_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`tourId` int NOT NULL,
	`sessionId` varchar(255),
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`durationSeconds` int,
	CONSTRAINT `view_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `affiliate_clicks` ADD CONSTRAINT `affiliate_clicks_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_clicks` ADD CONSTRAINT `affiliate_clicks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_conversions` ADD CONSTRAINT `affiliate_conversions_clickId_affiliate_clicks_id_fk` FOREIGN KEY (`clickId`) REFERENCES `affiliate_clicks`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_conversions` ADD CONSTRAINT `affiliate_conversions_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `affiliate_conversions` ADD CONSTRAINT `affiliate_conversions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_questionId_questions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_history` ADD CONSTRAINT `price_history_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_watches` ADD CONSTRAINT `price_watches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_watches` ADD CONSTRAINT `price_watches_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tour_tags` ADD CONSTRAINT `tour_tags_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tour_tags` ADD CONSTRAINT `tour_tags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tours` ADD CONSTRAINT `tours_agencyId_agencies_id_fk` FOREIGN KEY (`agencyId`) REFERENCES `agencies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `view_history` ADD CONSTRAINT `view_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `view_history` ADD CONSTRAINT `view_history_tourId_tours_id_fk` FOREIGN KEY (`tourId`) REFERENCES `tours`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tour_idx` ON `affiliate_clicks` (`tourId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `affiliate_clicks` (`userId`);--> statement-breakpoint
CREATE INDEX `clicked_at_idx` ON `affiliate_clicks` (`clickedAt`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `affiliate_conversions` (`tourId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `affiliate_conversions` (`userId`);--> statement-breakpoint
CREATE INDEX `converted_at_idx` ON `affiliate_conversions` (`convertedAt`);--> statement-breakpoint
CREATE INDEX `question_idx` ON `answers` (`questionId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `answers` (`userId`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `price_history` (`tourId`);--> statement-breakpoint
CREATE INDEX `recorded_at_idx` ON `price_history` (`recordedAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `price_watches` (`userId`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `price_watches` (`tourId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `questions` (`userId`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `questions` (`tourId`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `reviews` (`tourId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `reviews` (`userId`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `tour_tags` (`tourId`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `tour_tags` (`tagId`);--> statement-breakpoint
CREATE INDEX `agency_idx` ON `tours` (`agencyId`);--> statement-breakpoint
CREATE INDEX `destination_idx` ON `tours` (`destination`);--> statement-breakpoint
CREATE INDEX `departure_date_idx` ON `tours` (`departureDate`);--> statement-breakpoint
CREATE INDEX `tour_type_idx` ON `tours` (`tourType`);--> statement-breakpoint
CREATE INDEX `price_idx` ON `tours` (`price`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `view_history` (`userId`);--> statement-breakpoint
CREATE INDEX `tour_idx` ON `view_history` (`tourId`);--> statement-breakpoint
CREATE INDEX `viewed_at_idx` ON `view_history` (`viewedAt`);