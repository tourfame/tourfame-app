ALTER TABLE `scrape_jobs` ADD `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD `category` enum('asia','long_haul','china_long_haul','guangdong');--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD `scheduleEnabled` tinyint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD `lastExecutedAt` timestamp;--> statement-breakpoint
ALTER TABLE `scrape_jobs` ADD `nextExecutionAt` timestamp;