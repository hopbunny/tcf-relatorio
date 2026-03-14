ALTER TABLE `route_analyses` MODIFY COLUMN `colorMapping` json;--> statement-breakpoint
ALTER TABLE `route_analyses` MODIFY COLUMN `points` json;--> statement-breakpoint
ALTER TABLE `route_analyses` MODIFY COLUMN `optimizedRoute` json;--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `procedures` json;--> statement-breakpoint
ALTER TABLE `services` MODIFY COLUMN `observations` json;