"use server";

import { headers } from "next/headers";
import { Agent } from "undici";

function getWpBase(): string {
  const url = process.env.WP_API_URL || process.env.NEXT_PUBLIC_WP_API_URL;
  if (!url) throw new Error("WP_API_URL is not configured");
  return url.replace(/\/?$/, "");
}

function getAuthHeader(): string | undefined {
  const user = process.env.WP_USER || process.env.NEXT_PUBLIC_WP_USER;
  const pass = process.env.WP_APP_PASSWORD || process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
  if (!user || !pass) return undefined;
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

export async function wpFetch(path: string, init: RequestInit = {}) {
  const base = getWpBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const auth = getAuthHeader();

  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (auth) headersObj["Authorization"] = auth;

  // Allow local development against self-signed WP TLS when WP_INSECURE=1
  const allowInsecure = (process.env.WP_INSECURE || process.env.NEXT_PUBLIC_WP_INSECURE) === "1";
  const dispatcher = allowInsecure
    ? new Agent({ connect: { rejectUnauthorized: false } })
    : undefined;

  const res = await fetch(url, {
    ...init,
    headers: headersObj,
    // Make sure we don't cache writes/reads unnecessarily
    cache: "no-store",
    // Undici option to relax TLS only in dev if requested
    ...(dispatcher ? { dispatcher } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WP fetch failed ${res.status}: ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return res.text();
  }

  const raw = await res.text();
  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    const snippet = raw.length > 200 ? raw.substring(0, 200) + "..." : raw;
    throw new Error(`WP fetch returned invalid JSON: ${snippet}`);
  }
}

