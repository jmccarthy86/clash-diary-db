import { NextRequest } from "next/server";
import { getYearData } from "@/lib/actions/bookings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const y = searchParams.get("year");
    const year = y ? Number(y) : new Date().getFullYear();
    const data = await getYearData(year);

    const days = Object.keys(data?.Dates || {});
    let entries = 0;
    for (const d of days) entries += Object.keys((data as any).Dates[d] || {}).length;

    return new Response(
      JSON.stringify({ ok: true, year, days: days.length, entries }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

