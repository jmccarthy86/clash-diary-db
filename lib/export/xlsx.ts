import * as XLSX from "xlsx";
import {
  unCamelCase,
  resolveTitleOfShow,
  resolveVenueInfo,
} from "@/lib/utils";

type RowMap = Record<string, any>;

// Exclude technical fields and columns we no longer export
const EXCLUDE_KEYS = new Set([
  "userId",
  "date",
  "range",
  "id",
  "dateBkd",
  "day",
  "uktVenue",
  "affiliateVenue",
  "otherVenue",
  "combinedVenue",
  "isSeasonGala",
  "isOperaDance",
  "showTitleIsTba",
  "venueIsTba",
  "VenueIsTba",
  "venue_is_tba",
  "soltMemberNonSoltVenue",
  "SoltMemberNonSoltVenue",
  "solt_member_non_solt_venue",
]);

// Preferred ordering of columns (lowerCamel where applicable)
const PREFERRED_ORDER = [
  "Date",
  "titleOfShow",
  "venue",
  "membership",
  "producer",
  "pressContact",
  "p",
  "tags",
  "timeStamp",
  "id",
  "createdAt",
  "range",
  "date",
];

const BOOL_FIELD_RENDERERS = new Map<string, (value: any) => string>([
  ["p", (value: any) => (toBoolean(value) ? "Yes" : "")],
]);

function toBoolean(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "1" || t === "true" || t === "yes" || t === "y" || t === "on";
  }
  return false;
}

function coerceDateValue(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getTime();
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [dd, mm, yyyy] = trimmed.split("/").map((val) => Number(val));
      const parsed = new Date(yyyy, mm - 1, dd);
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function rowDateTimestamp(row: Record<string, any>): number {
  const candidates = [row.Date, row.date, row.timeStamp, row.createdAt];
  for (const candidate of candidates) {
    const ts = coerceDateValue(candidate);
    if (ts !== null) return ts;
  }
  return Number.POSITIVE_INFINITY;
}

function sortByDate(rows: Record<string, any>[]): Record<string, any>[] {
  return [...rows].sort((a, b) => {
    const aTs = rowDateTimestamp(a);
    const bTs = rowDateTimestamp(b);
    if (aTs === bTs) {
      return String(a.titleOfShow ?? "").localeCompare(String(b.titleOfShow ?? ""));
    }
    return aTs - bTs;
  });
}

function prepareColumns(allRows: Record<string, any>[]): string[] {
  const present = new Set<string>();
  for (const r of allRows) Object.keys(r || {}).forEach((k) => present.add(k));

  // Start with Date if present
  const cols: string[] = [];
  if (present.has("Date")) cols.push("Date");

  // Add preferred fields (excluding those already added/excluded)
  for (const key of PREFERRED_ORDER) {
    if (key === "Date") continue;
    if (EXCLUDE_KEYS.has(key)) continue;
    if (present.has(key) && !cols.includes(key)) cols.push(key);
  }

  // Add any remaining present keys not yet included and not excluded
  present.forEach((key) => {
    if (!cols.includes(key) && !EXCLUDE_KEYS.has(key)) cols.push(key);
  });

  // Fallback: if we somehow only captured Date, include a sensible default set
  if (cols.length <= 1) {
    const defaults = PREFERRED_ORDER.filter((k) => !EXCLUDE_KEYS.has(k));
    // Keep Date first if present
    const rest = defaults.filter((k) => k !== "Date");
    return cols.length === 1 ? [cols[0], ...rest] : defaults;
  }

  return cols;
}

function headerLabels(cols: string[]): string[] {
  return cols.map((h) => {
    if (h === "timeStamp") return "Date Updated";
    if (h === "p") return "Pencilled";
    if (h === "createdAt") return "Date Created";
    return unCamelCase(h);
  });
}

function widthForKey(k: string): number | undefined {
  // Fix widths for date-like columns to avoid #### display
  if (k === "Date" || k === "timeStamp" || k === "createdAt") return 12; // dd/mm/yyyy
  return undefined;
}

function cellStringLength(value: any): number {
  if (value === null || value === undefined) return 0;
  if (value instanceof Date) return 10; // dd/mm/yyyy
  const str = typeof value === "string" ? value : String(value);
  return str.length;
}

function autoColumnWidths(aoa: any[][], columns: string[]): ({ wch: number } | undefined)[] {
  return columns.map((key, index) => {
    let maxLen = 0;
    for (const row of aoa) {
      const value = Array.isArray(row) ? row[index] : undefined;
      const len = cellStringLength(value);
      if (len > maxLen) maxLen = len;
    }
    const preferred = widthForKey(key) ?? 0;
    const padded = maxLen > 0 ? maxLen + 2 : 0; // small padding keeps text readable
    const width = Math.max(preferred, padded);
    return width ? { wch: Math.min(width, 255) } : undefined;
  });
}

export function buildWorkbook(rowsMap: RowMap): XLSX.WorkBook {
  const entries = Object.values(rowsMap ?? {});
  const normalizedEntries = (entries as Record<string, any>[]).map((row) => {
    const venueInfo = resolveVenueInfo(row);
    const venue = venueInfo.venue;
    const membership = venueInfo.membership;
    const resolvedTitle = resolveTitleOfShow(row.titleOfShow, row.showTitleIsTba);
    const titleDisplay = resolvedTitle || "TBA";
    const isSeasonGala = toBoolean(row.isSeasonGala);
    const isOperaDance = toBoolean(row.isOperaDance);
    const tags = [
      isSeasonGala ? "Season Announcement/Gala Night" : "",
      isOperaDance ? "Opera/Dance" : "",
    ]
      .filter(Boolean)
      .join(", ");
    const {
      venueIsTba: _venueIsTba,
      VenueIsTba: _VenueIsTba,
      venue_is_tba: _venue_is_tba,
      soltMemberNonSoltVenue: _soltMemberNonSoltVenue,
      SoltMemberNonSoltVenue: _SoltMemberNonSoltVenue,
      solt_member_non_solt_venue: _solt_member_non_solt_venue,
      showTitleIsTba: _showTitleIsTba,
      show_title_is_tba: _show_title_is_tba,
      ...rest
    } = row;
    return {
      ...rest,
      venue,
      membership,
      titleOfShow: titleDisplay,
      isSeasonGala,
      isOperaDance,
      tags,
    };
  });
  const orderedEntries = sortByDate(normalizedEntries as Record<string, any>[]);
  const wb = XLSX.utils.book_new();
  if (!orderedEntries.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No data"]]), "First Night Diary");
    return wb;
  }

  // debug: surface shape in dev consoles
  try {
    // eslint-disable-next-line no-console
    console.log("xlsx entries[0] keys:", Object.keys(orderedEntries[0] || {}));
  } catch {}

  const columns = prepareColumns(orderedEntries as Record<string, any>[]);
  try {
    // eslint-disable-next-line no-console
    console.log("xlsx columns:", columns);
  } catch {}
  const header = headerLabels(columns);
  const aoa: any[][] = [header];

  for (const row of orderedEntries as any[]) {
    const arr: any[] = [];
    for (const k of columns) {
      if (k === "Date") {
        let d: any = row[k];
        if (!d && row.date) d = new Date(row.date);
        arr.push(d instanceof Date ? d : d ?? "");
      } else if (k === "titleOfShow") {
        arr.push(row.titleOfShow ?? "");
      } else if (k === "timeStamp" || k === "createdAt") {
        const v = row[k];
        if (typeof v === "number") arr.push(new Date(v)); else arr.push(v ?? "");
      } else if (k === "venue") {
        arr.push(row.venue ?? "");
      } else if (BOOL_FIELD_RENDERERS.has(k)) {
        arr.push(BOOL_FIELD_RENDERERS.get(k)!(row[k]));
      } else {
        arr.push(row[k] ?? "");
      }
    }
    aoa.push(arr);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Column widths
  (ws as any)["!cols"] = autoColumnWidths(aoa, columns);

  // Date column formatting (Date, timeStamp => Date Booked, createdAt)
  const dateCols = [
    columns.indexOf("Date"),
    columns.indexOf("timeStamp"),
    columns.indexOf("createdAt"),
  ].filter((i) => i >= 0) as number[];
  for (const c of dateCols) {
    for (let r = 1; r < aoa.length; r++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = (ws as any)[ref];
      if (cell && cell.v instanceof Date) {
        cell.t = "d";
        cell.z = "dd/mm/yyyy";
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "First Night Diary");
  return wb;
}

