PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`day` text,
	`p` integer DEFAULT 0,
	`venue` text NOT NULL,
	`ukt_venue` text,
	`affiliate_venue` text,
	`other_venue` text,
	`venue_is_tba` integer DEFAULT 0,
	`title_of_show` text NOT NULL,
	`show_title_is_tba` integer DEFAULT 0,
	`producer` text,
	`press_contact` text,
	`date_bkd` text,
	`is_season_gala` integer DEFAULT 0,
	`is_opera_dance` integer DEFAULT 0,
	`user_id` text,
	`time_stamp` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bookings`("date", "day", "p", "venue", "ukt_venue", "affiliate_venue", "other_venue", "venue_is_tba", "title_of_show", "show_title_is_tba", "producer", "press_contact", "date_bkd", "is_season_gala", "is_opera_dance", "user_id", "time_stamp", "created_at") SELECT "date", "day", "p", "venue", "ukt_venue", "affiliate_venue", "other_venue", "venue_is_tba", "title_of_show", "show_title_is_tba", "producer", "press_contact", "date_bkd", "is_season_gala", "is_opera_dance", "user_id", "time_stamp", "created_at" FROM `bookings`;--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
ALTER TABLE `__new_bookings` RENAME TO `bookings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;