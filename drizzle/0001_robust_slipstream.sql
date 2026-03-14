CREATE TABLE `ai_learning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceType` varchar(100) NOT NULL,
	`field` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`usageCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_learning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`imageUrl` text NOT NULL,
	`colorMapping` json NOT NULL DEFAULT ('{}'),
	`points` json NOT NULL DEFAULT ('[]'),
	`optimizedRoute` json NOT NULL DEFAULT ('[]'),
	`routeImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `route_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`technicianId` int NOT NULL,
	`clientCode` varchar(100) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`serviceType` varchar(100) NOT NULL,
	`description` text NOT NULL DEFAULT (''),
	`procedures` json NOT NULL DEFAULT ('[]'),
	`analysis` text,
	`observations` json NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`technicianName` varchar(255) NOT NULL,
	`responsibleName` varchar(255) NOT NULL,
	`date` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicians_id` PRIMARY KEY(`id`)
);
