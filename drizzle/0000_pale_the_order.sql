CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
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
CREATE TABLE `venues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`type` text NOT NULL
);
