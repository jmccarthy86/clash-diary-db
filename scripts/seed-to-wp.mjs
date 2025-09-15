import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';

const ROOT = process.cwd();
// Load env from .env.local if present, else .env
try {
  const localPath = path.join(ROOT, '.env.local');
  const envPath = fs.existsSync(localPath) ? localPath : path.join(ROOT, '.env');
  dotenv.config({ path: envPath });
} catch {}
const DATA_DIR = path.join(ROOT, 'data');

function requiredEnv(name, fallbackName) {
  const v = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

function getWpConfig() {
  const base = (process.env.WP_API_URL || process.env.NEXT_PUBLIC_WP_API_URL || '').replace(/\/?$/, '');
  if (!base) throw new Error('WP_API_URL or NEXT_PUBLIC_WP_API_URL is not configured');
  const user = requiredEnv('WP_USER', 'NEXT_PUBLIC_WP_USER');
  const pass = requiredEnv('WP_APP_PASSWORD', 'NEXT_PUBLIC_WP_APP_PASSWORD');
  const token = Buffer.from(`${user}:${pass}`).toString('base64');
  // Allow opting out of TLS verification for local dev via WP_INSECURE=1
  const insecure = (process.env.WP_INSECURE === '1');
  if (insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  return { base, auth: `Basic ${token}`, insecure };
}

function normalizeKey(k) {
  return String(k || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function asciiClean(val) {
  if (val == null) return '';
  let s = String(val);
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u00A0]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
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

function mapHeaderToDbKey(header) {
  const n = normalizeKey(header);
  const map = {
    date: 'date',
    day: 'day',
    titleofshow: 'title_of_show',
    showtitle: 'title_of_show',
    showtitleoftheproduction: 'title_of_show',
    venue: 'venue',
    ukvenue: 'ukt_venue',
    uktvenue: 'ukt_venue',
    affiliatevenue: 'affiliate_venue',
    othervenue: 'other_venue',
    p: 'p',
    pencilled: 'p',
    penciled: 'p',
    venueistba: 'venue_is_tba',
    showtitleistba: 'show_title_is_tba',
    isseasongala: 'is_season_gala',
    seasongala: 'is_season_gala',
    isoperadance: 'is_opera_dance',
    operadance: 'is_opera_dance',
    producer: 'producer',
    presscontact: 'press_contact',
    email: 'press_contact',
    datebkd: 'date_bkd',
    datebooked: 'date_bkd',
    userid: 'user_id',
    timestamp: 'time_stamp',
    updatedat: 'time_stamp',
    createdat: 'created_at',
  };
  return map[n] || null;
}

function toBoolean(v) {
  if (v === null || v === undefined || v === '') return false;
  if (typeof v === 'number') return !!v;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  return (s === '1' || s === 'y' || s === 'yes' || s === 'true');
}

function toTimestamp(v) {
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') {
    if (v < 10000000) {
      const excelEpoch = Date.UTC(1900, 0, 1);
      const days = Math.floor(v);
      const dateInMs = excelEpoch + (days - 2) * 24 * 60 * 60 * 1000;
      return dateInMs;
    }
    if (v < 1e12) return Math.round(v * 1000);
    return v;
  }
  const s = String(v).trim();
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

  const dateTs = toTimestamp(out['date']);
  if (!dateTs) return null; // require date

  let day = out['day'] ? String(out['day']) : undefined;
  if (!day) {
    try { day = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(new Date(dateTs)); } catch {}
  }

  const title = out['title_of_show'] != null ? normalizeAndCount('title_of_show', out['title_of_show']) : '';
  const venue = out['venue'] != null ? normalizeAndCount('venue', out['venue']) : '';

  return {
    date: dateTs,
    day: day ?? '',
    p: toBoolean(out['p']),
    venue,
    ukt_venue: out['ukt_venue'] != null ? normalizeAndCount('ukt_venue', out['ukt_venue']) : '',
    affiliate_venue: out['affiliate_venue'] != null ? normalizeAndCount('affiliate_venue', out['affiliate_venue']) : '',
    other_venue: out['other_venue'] != null ? normalizeAndCount('other_venue', out['other_venue']) : '',
    venue_is_tba: toBoolean(out['venue_is_tba']),
    title_of_show: title,
    show_title_is_tba: toBoolean(out['show_title_is_tba']),
    producer: out['producer'] != null ? normalizeAndCount('producer', out['producer']) : '',
    press_contact: out['press_contact'] != null ? normalizeAndCount('press_contact', out['press_contact']) : '',
    date_bkd: out['date_bkd'] ? String(out['date_bkd']) : '',
    is_season_gala: toBoolean(out['is_season_gala']),
    is_opera_dance: toBoolean(out['is_opera_dance']),
    user_id: out['user_id'] ? String(out['user_id']) : '',
    time_stamp: out['time_stamp'] ? toTimestamp(out['time_stamp']) : undefined,
  };
}

async function wpRequest(wp, path, init = {}) {
  const url = `${wp.base}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': wp.auth,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`WP ${init.method || 'GET'} ${url} failed ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

async function purgeAll(wp) {
  let page = 1; let totalDeleted = 0;
  for (;;) {
    const listUrl = `/wp-json/wp/v2/fnd_booking?per_page=100&page=${page}`;
    const res = await wpRequest(wp, listUrl, { method: 'GET' });
    if (!Array.isArray(res) || res.length === 0) break;
    for (const post of res) {
      const id = post.id;
      await wpRequest(wp, `/wp-json/fnd/v1/bookings/${id}`, { method: 'DELETE' });
      totalDeleted++;
    }
    page++;
  }
  return totalDeleted;
}

export async function seedToWp({ reset = false } = {}) {
  const wp = getWpConfig();
  console.log(`WP: ${wp.base}`);
  console.log(`DATA: ${DATA_DIR}`);
  if (wp.insecure) console.warn('WP_INSECURE=1 set: TLS verification disabled (dev only).');

  // Quick connectivity check to give early, clear errors
  try {
    await wpRequest(wp, '/wp-json', { method: 'GET' });
    console.log('WP connectivity OK');
  } catch (e) {
    console.error('WP connectivity check failed:', e.message);
    throw e;
  }

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`No data directory found at: ${DATA_DIR}`);
    return { inserted: 0, files: [] };
  }

  if (reset) {
    const deleted = await purgeAll(wp);
    console.log(`Deleted ${deleted} existing bookings from WP`);
  }

  const csvFiles = fs.readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith('.csv'));
  if (!csvFiles.length) {
    console.warn('No .csv files found in data/');
    return { inserted: 0, files: [] };
  }

  let inserted = 0;
  const filesProcessed = [];
  for (const file of csvFiles) {
    const full = path.join(DATA_DIR, file);
    const rawRows = loadCsvRows(full);
    const rows = rawRows.map(coerceRow).filter(Boolean);

    for (const r of rows) {
      try {
        await wpRequest(wp, '/wp-json/fnd/v1/bookings', {
          method: 'POST',
          body: JSON.stringify(r),
        });
        inserted++;
      } catch (e) {
        const extra = e && e.cause && e.cause.code ? ` (${e.cause.code})` : '';
        console.error(`Failed to insert row:`, e.message + extra);
      }
    }
    filesProcessed.push({ file, rows: rows.length });
  }

  return { inserted, files: filesProcessed, normalization: normalizationStats };
}

// Ensure CLI execution detection works cross-platform (Windows paths, etc.)
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const reset = process.argv.includes('--reset');
  seedToWp({ reset })
    .then((res) => {
      console.log(`Seeded ${res.inserted} rows into WP from ${res.files.length} file(s).`);
      res.files.forEach((f) => console.log(` - ${f.file}: ${f.rows} rows`));
      const keys = Object.keys(res.normalization || {}).filter((k) => res.normalization[k] > 0);
      if (keys.length) {
        console.log('Normalization changes (field: count):');
        keys.forEach((k) => console.log(` - ${k}: ${res.normalization[k]}`));
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding to WP failed:', err);
      process.exit(1);
    });
}
