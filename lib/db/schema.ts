import { sqliteTable, text, int, integer } from 'drizzle-orm/sqlite-core';

/* Mirrors every Excel header, keeps the column name `date` */
export const bookings = sqliteTable('bookings', {
    id:             integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    date:           int('date').notNull(),     // Unix‑ms timestamp
    day:            text('day'),
    p:              int('p').default(0),
    venue:          text('venue').notNull(),
    uktVenue:       text('ukt_venue'),
    affiliateVenue: text('affiliate_venue'),
    otherVenue:     text('other_venue'),
    venueIsTba:     int('venue_is_tba').default(0),
    titleOfShow:    text('title_of_show').notNull(),
    showTitleIsTba: int('show_title_is_tba').default(0),
    producer:       text('producer'),
    pressContact:   text('press_contact'),
    dateBkd:        text('date_bkd'),              // Excel serial or string
    isSeasonGala:   int('is_season_gala').default(0),
    isOperaDance:   int('is_opera_dance').default(0),
    userId:         text('user_id'),
    timeStamp:      int('time_stamp'),
    createdAt:      int('created_at').notNull()
});

export const venues = sqliteTable('venues', {
    id: int().primaryKey({ autoIncrement: true }),
    value: text('value').notNull(),
    label: text('label').notNull(),
    type: text('type').notNull()
});