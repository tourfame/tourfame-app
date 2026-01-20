CREATE TABLE `image_cleanup_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`filePath` varchar(500) NOT NULL,
	`fileSize` int,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	`deletedBy` varchar(50) NOT NULL,
	`reason` text,
	CONSTRAINT `image_cleanup_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `image_cleanup_logs` (`deletedAt`);--> statement-breakpoint
CREATE INDEX `deleted_by_idx` ON `image_cleanup_logs` (`deletedBy`);