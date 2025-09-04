import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import * as XLSX from 'xlsx';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(ROOT, 'lib', 'db', 'app.db');

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

function openDb() {
  ensureDir(DB_PATH);
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

// Create table if it doesn't exist, matching current schema
function ensureSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL,
    day TEXT,
    p INTEGER DEFAULT 0,
    venue TEXT NOT NULL,
    ukt_venue TEXT,
    affiliate_venue TEXT,
    other_venue TEXT,
    venue_is_tba INTEGER DEFAULT 0,
    title_of_show TEXT NOT NULL,
    show_title_is_tba INTEGER DEFAULT 0,
    producer TEXT,
    press_contact TEXT,
    date_bkd TEXT,
    is_season_gala INTEGER DEFAULT 0,
    is_opera_dance INTEGER DEFAULT 0,
    user_id TEXT,
    time_stamp INTEGER,
    created_at INTEGER NOT NULL
  );`);
}

function normalizeKey(k) {
  return String(k || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

// Remove diacritics and normalize punctuation to basic ASCII
function asciiClean(val) {
  if (val == null) return '';
  let s = String(val);
  // Normalize accents/diacritics
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Common punctuation and whitespace fixes
  s = s
    .replace(/[\u2018\u2019\u2032]/g, "'") // curly single quotes to '
    .replace(/[\u201C\u201D\u2033]/g, '"') // curly double quotes to "
    .replace(/[\u2013\u2014]/g, '-')        // en/em dashes to -
    .replace(/[\u00A0]/g, ' ')              // non-breaking space to space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-widths
    .replace(/\s+/g, ' ')                   // collapse whitespace
    .trim();
  return s;
}

const normalizationStats = Object.create(null);
function normalizeAndCount(key, value) {
  const before = value == null ? '' : String(value);
  const after = asciiClean(before);
  if (after !== before) normalizationStats[key] = (normalizationStats[key] || 0) + 1;
  return after;
}

// Map many possible CSV headers to DB column names
function mapHeaderToDbKey(header) {
  const n = normalizeKey(header);
  const map = {
    // dates
    date: 'date',
    day: 'day',

    // titles / names
    titleofshow: 'title_of_show',
    showtitle: 'title_of_show',
    showtitleoftheproduction: 'title_of_show',

    // venues
    venue: 'venue',
    ukvenue: 'ukt_venue',
    uktvenue: 'ukt_venue',
    affiliatevenue: 'affiliate_venue',
    othervenue: 'other_venue',

    // booleans
    p: 'p',
    pencilled: 'p',
    penciled: 'p',
    venueistba: 'venue_is_tba',
    showtitleistba: 'show_title_is_tba',
    isseasongala: 'is_season_gala',
    seasongala: 'is_season_gala',
    isoperadance: 'is_opera_dance',
    operadance: 'is_opera_dance',

    // people / contact
    producer: 'producer',
    presscontact: 'press_contact',
    email: 'press_contact',

    // misc
    datebkd: 'date_bkd',
    datebooked: 'date_bkd',
    userid: 'user_id',
    timestamp: 'time_stamp',
    updatedat: 'time_stamp',
    createdat: 'created_at',
  };
  return map[n] || null;
}

function toBooleanInt(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v ? 1 : 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  return (s === '1' || s === 'y' || s === 'yes' || s === 'true') ? 1 : 0;
}

// Convert a dd/MM/yyyy string or ISO string or Excel serial to ms timestamp
function toTimestamp(v) {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') {
    // treat as Excel serial if < 10^7-ish; else assume already ms epoch
    if (v < 10000000) {
      const excelEpoch = Date.UTC(1900, 0, 1);
      const days = Math.floor(v);
      const dateInMs = excelEpoch + (days - 2) * 24 * 60 * 60 * 1000;
      return dateInMs;
    }
    // Could be seconds; multiply to ms if looks like seconds
    if (v < 1e12) return Math.round(v * 1000);
    return v;
  }
  const s = String(v).trim();
  // dd/MM/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return d.getTime();
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.getTime();
  return undefined;
}

function loadCsvRows(file) {
  // Read CSV content and parse via xlsx read(buffer)
  const buf = fs.readFileSync(file);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return json;
}

function coerceRow(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const dbKey = mapHeaderToDbKey(k);
    if (!dbKey) continue;
    out[dbKey] = v;
  }

  // Required field: date. All others may be empty strings.
  const dateTs = toTimestamp(out['date']);
  const createdAt = toTimestamp(out['created_at']) ?? Date.now();
  const timeStamp = toTimestamp(out['time_stamp']);
  let day = out['day'] ? String(out['day']) : undefined;
  // No fallback between venue and other_venue; keep them separate. Empty is allowed.
  const venue = out['venue'] != null ? normalizeAndCount('venue', out['venue']) : '';
  const title = out['title_of_show'] != null ? normalizeAndCount('title_of_show', out['title_of_show']) : '';

  if (!dateTs) {
    return null;
  }

  // If day missing, derive from date (keep as English name like working code)
  if (!day && dateTs) {
    try {
      day = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(new Date(dateTs));
    } catch {}
  }

  return {
    date: dateTs,
    day: day ?? null,
    p: toBooleanInt(out['p']),
    venue, // may be empty string; DB column is NOT NULL so '' is acceptable
    ukt_venue: out['ukt_venue'] != null ? normalizeAndCount('ukt_venue', out['ukt_venue']) : null,
    affiliate_venue: out['affiliate_venue'] != null ? normalizeAndCount('affiliate_venue', out['affiliate_venue']) : null,
    other_venue: out['other_venue'] != null ? normalizeAndCount('other_venue', out['other_venue']) : null,
    venue_is_tba: toBooleanInt(out['venue_is_tba']),
    title_of_show: title,
    show_title_is_tba: toBooleanInt(out['show_title_is_tba']),
    producer: out['producer'] != null ? normalizeAndCount('producer', out['producer']) : null,
    press_contact: out['press_contact'] != null ? normalizeAndCount('press_contact', out['press_contact']) : null,
    date_bkd: out['date_bkd'] ? String(out['date_bkd']) : null,
    is_season_gala: toBooleanInt(out['is_season_gala']),
    is_opera_dance: toBooleanInt(out['is_opera_dance']),
    user_id: out['user_id'] ? String(out['user_id']) : null,
    time_stamp: timeStamp ?? null,
    created_at: createdAt,
  };
}

export async function seedFromCsv({ reset = false } = {}) {
  console.log(`DB: ${DB_PATH}`);
  console.log(`DATA: ${DATA_DIR}`);
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`No data directory found at: ${DATA_DIR}`);
    return { inserted: 0, files: [] };
  }

  const csvFiles = fs.readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith('.csv'));
  if (!csvFiles.length) {
    console.warn('No .csv files found in data/');
    return { inserted: 0, files: [] };
  }

  const db = openDb();
  ensureSchema(db);

  const filesProcessed = [];
  let inserted = 0;
  const tx = db.transaction((rows) => {
    if (reset) {
      db.prepare('DELETE FROM bookings').run();
    }
    const stmt = db.prepare(`INSERT INTO bookings (
      date, day, p, venue, ukt_venue, affiliate_venue, other_venue, venue_is_tba,
      title_of_show, show_title_is_tba, producer, press_contact, date_bkd,
      is_season_gala, is_opera_dance, user_id, time_stamp, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const r of rows) {
      stmt.run(
        r.date,
        r.day,
        r.p,
        r.venue,
        r.ukt_venue,
        r.affiliate_venue,
        r.other_venue,
        r.venue_is_tba,
        r.title_of_show,
        r.show_title_is_tba,
        r.producer,
        r.press_contact,
        r.date_bkd,
        r.is_season_gala,
        r.is_opera_dance,
        r.user_id,
        r.time_stamp,
        r.created_at
      );
      inserted++;
    }
  });

  for (const file of csvFiles) {
    const full = path.join(DATA_DIR, file);
    const rawRows = loadCsvRows(full);
    const rows = rawRows.map(coerceRow).filter(Boolean);
    tx.immediate(rows);
    filesProcessed.push({ file, rows: rows.length });
  }

  db.close();
  // Re-open to compute counts safely after commit
  const db2 = openDb();
  const row = db2.prepare('SELECT COUNT(*) as cnt, MIN(date) as minDate, MAX(date) as maxDate FROM bookings').get();
  const perYear = db2.prepare('SELECT strftime(\'%Y\', datetime(date/1000, \'unixepoch\')) as y, COUNT(*) as c FROM bookings GROUP BY y ORDER BY y').all();
  db2.close();

  return { inserted, files: filesProcessed, normalization: normalizationStats, total: row?.cnt ?? 0, minDate: row?.minDate ?? null, maxDate: row?.maxDate ?? null, perYear };
}

// Run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const reset = process.argv.includes('--reset');
  seedFromCsv({ reset })
    .then((res) => {
      console.log(`Seeded ${res.inserted} rows from ${res.files.length} file(s).`);
      res.files.forEach((f) => console.log(` - ${f.file}: ${f.rows} rows`));
      const keys = Object.keys(res.normalization || {}).filter((k) => res.normalization[k] > 0);
      if (keys.length) {
        console.log('Normalization changes (field: count):');
        keys.forEach((k) => console.log(` - ${k}: ${res.normalization[k]}`));
      }
      console.log(`Total rows in DB: ${res.total}`);
      if (res.total) {
        const min = res.minDate ? new Date(res.minDate).toISOString().slice(0,10) : 'n/a';
        const max = res.maxDate ? new Date(res.maxDate).toISOString().slice(0,10) : 'n/a';
        console.log(`Date range: ${min} → ${max}`);
        if (Array.isArray(res.perYear)) {
          console.log('Per-year counts:');
          res.perYear.forEach(r => console.log(` - ${r.y}: ${r.c}`));
        }
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
