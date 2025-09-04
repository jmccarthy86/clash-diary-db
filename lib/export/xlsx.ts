import * as XLSX from "xlsx";
import { unCamelCase } from "@/lib/utils";

type RowMap = Record<string, any>;

// Only exclude userId, raw 'date' (we export the human 'Date'), technical 'range', and 'id'
const EXCLUDE_KEYS = new Set(["userId", "date", "range", "id"]);

// Preferred ordering of columns (lowerCamel where applicable)
const PREFERRED_ORDER = [
  "Date",
  "titleOfShow",
  "venue",
  "uktVenue",
  "affiliateVenue",
  "otherVenue",
  "venueIsTba",
  "producer",
  "pressContact",
  "p",
  "isSeasonGala",
  "isOperaDance",
  "dateBkd",
  "timeStamp",
  "id",
  "createdAt",
  "range",
  "date",
  "day",
];

const BOOL_FIELDS = new Set([
  "p",
  "venueIsTba",
  "showTitleIsTba",
  "isSeasonGala",
  "isOperaDance",
]);

function toYesNo(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v !== 0 ? "Yes" : "No";
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "1" || t === "true" || t === "yes") return "Yes";
    if (t === "0" || t === "false" || t === "no") return "No";
  }
  return String(v);
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
  return cols.map((h) => (h === "timeStamp" ? "Date Updated" : unCamelCase(h)));
}

function widthForKey(k: string): number | undefined {
  // Fix widths for date-like columns to avoid #### display
  if (k === "Date" || k === "timeStamp" || k === "createdAt") return 12; // dd/mm/yyyy
  return undefined;
}

export function buildWorkbook(rowsMap: RowMap): XLSX.WorkBook {
  const entries = Object.values(rowsMap ?? {});
  const wb = XLSX.utils.book_new();
  if (!entries.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No data"]]), "First Night Diary");
    return wb;
  }

  // debug: surface shape in dev consoles
  try {
    // eslint-disable-next-line no-console
    console.log("xlsx entries[0] keys:", Object.keys(entries[0] || {}));
  } catch {}

  const columns = prepareColumns(entries as Record<string, any>[]);
  try {
    // eslint-disable-next-line no-console
    console.log("xlsx columns:", columns);
  } catch {}
  const header = headerLabels(columns);
  const aoa: any[][] = [header];

  for (const row of entries as any[]) {
    const arr: any[] = [];
    for (const k of columns) {
      if (k === "Date") {
        let d: any = row[k];
        if (!d && row.date) d = new Date(row.date);
        arr.push(d instanceof Date ? d : d ?? "");
      } else if (k === "timeStamp" || k === "createdAt") {
        const v = row[k];
        if (typeof v === "number") arr.push(new Date(v)); else arr.push(v ?? "");
      } else if (BOOL_FIELDS.has(k)) {
        arr.push(toYesNo(row[k]));
      } else {
        arr.push(row[k] ?? "");
      }
    }
    aoa.push(arr);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Column widths
  (ws as any)["!cols"] = columns.map((c) => {
    const wch = widthForKey(c);
    return wch ? { wch } : undefined as any; // leave others unset to use default width
  });

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
