import Database from 'better-sqlite3';

const db = new Database('lib/db/app.db');

export async function seed() {
  console.log('Seeding bookings table...');

  // Current timestamp
  const now = Date.now();

  // Sample booking data
  const sampleBookings = [
    {
      id: 'booking-001',
      date: new Date('2024-03-15').getTime(),
      day: 'Friday',
      p: 0,
      venue: 'Royal Opera House',
      ukt_venue: 'ROH',
      affiliate_venue: null,
      other_venue: null,
      venue_is_tba: 0,
      title_of_show: 'Swan Lake',
      show_title_is_tba: 0,
      producer: 'Royal Ballet',
      press_contact: 'press@roh.org.uk',
      date_bkd: '2024-01-10',
      is_season_gala: 0,
      is_opera_dance: 1,
      user_id: 'user-001',
      time_stamp: now,
      created_at: now
    },
    {
      id: 'booking-002',
      date: new Date('2024-03-20').getTime(),
      day: 'Wednesday',
      p: 1,
      venue: 'National Theatre',
      ukt_venue: 'NT',
      affiliate_venue: null,
      other_venue: null,
      venue_is_tba: 0,
      title_of_show: 'The Curious Incident of the Dog in the Night-Time',
      show_title_is_tba: 0,
      producer: 'National Theatre Productions',
      press_contact: 'press@nationaltheatre.org.uk',
      date_bkd: '2024-01-15',
      is_season_gala: 0,
      is_opera_dance: 0,
      user_id: 'user-002',
      time_stamp: now,
      created_at: now
    },
    {
      id: 'booking-003',
      date: new Date('2024-04-02').getTime(),
      day: 'Tuesday',
      p: 0,
      venue: 'Barbican Centre',
      ukt_venue: 'Barbican',
      affiliate_venue: null,
      other_venue: null,
      venue_is_tba: 0,
      title_of_show: 'Hamlet',
      show_title_is_tba: 0,
      producer: 'RSC',
      press_contact: 'media@rsc.org.uk',
      date_bkd: '2024-02-01',
      is_season_gala: 1,
      is_opera_dance: 0,
      user_id: 'user-003',
      time_stamp: now,
      created_at: now
    },
    {
      id: 'booking-004',
      date: new Date('2024-04-10').getTime(),
      day: 'Wednesday',
      p: 1,
      venue: 'TBA',
      ukt_venue: null,
      affiliate_venue: null,
      other_venue: null,
      venue_is_tba: 1,
      title_of_show: 'TBA',
      show_title_is_tba: 1,
      producer: 'Independent Productions',
      press_contact: null,
      date_bkd: '2024-02-15',
      is_season_gala: 0,
      is_opera_dance: 0,
      user_id: 'user-004',
      time_stamp: now,
      created_at: now
    },
    {
      id: 'booking-005',
      date: new Date('2024-05-01').getTime(),
      day: 'Wednesday',
      p: 0,
      venue: 'Old Vic',
      ukt_venue: 'Old Vic',
      affiliate_venue: null,
      other_venue: null,
      venue_is_tba: 0,
      title_of_show: 'A Christmas Carol',
      show_title_is_tba: 0,
      producer: 'Old Vic Productions',
      press_contact: 'press@oldvictheatre.com',
      date_bkd: '2024-02-20',
      is_season_gala: 0,
      is_opera_dance: 0,
      user_id: 'user-005',
      time_stamp: now,
      created_at: now
    }
  ];

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO bookings (
      id, date, day, p, venue, ukt_venue, affiliate_venue, other_venue, venue_is_tba,
      title_of_show, show_title_is_tba, producer, press_contact, date_bkd,
      is_season_gala, is_opera_dance, user_id, time_stamp, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let successful = 0;
  
  // Insert each booking
  for (const booking of sampleBookings) {
    try {
      insertStmt.run(
        booking.id,
        booking.date,
        booking.day,
        booking.p,
        booking.venue,
        booking.ukt_venue,
        booking.affiliate_venue,
        booking.other_venue,
        booking.venue_is_tba,
        booking.title_of_show,
        booking.show_title_is_tba,
        booking.producer,
        booking.press_contact,
        booking.date_bkd,
        booking.is_season_gala,
        booking.is_opera_dance,
        booking.user_id,
        booking.time_stamp,
        booking.created_at
      );
      console.log(`✓ Inserted booking: ${booking.title_of_show} at ${booking.venue}`);
      successful++;
    } catch (error) {
      console.error(`✗ Failed to insert booking: ${booking.title_of_show}`, error);
    }
  }

  console.log(`\nSeed completed! Inserted ${successful} out of ${sampleBookings.length} bookings.`);
  db.close();

  return {
    total: sampleBookings.length,
    successful,
    bookings: successful
  };
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then((result) => {
      console.log('Seed result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}