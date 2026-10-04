// Single configurable base URL. Production builds point at the live Render
// deployment; EXPO_PUBLIC_API_URL overrides this for staging or local dev.
const RAW = process.env.EXPO_PUBLIC_API_URL || "https://sai-sandesh.onrender.com";
export const API_BASE_URL = RAW.replace(/\/$/, "");

import type {
  Devotional,
  SearchResult,
  TopicQA,
  TopicSummary,
} from "./types";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  let url = API_BASE_URL + path;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) qs.set(k, String(v));
    url += "?" + qs.toString();
  }
  const res = await fetch(url);
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (body && typeof body.detail === "string") detail = body.detail;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

/** Resolve a possibly-relative backend path (e.g. /cards/2026-10-04.png). */
export function resolveUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE_URL + (path.startsWith("/") ? path : "/" + path);
}

export const getToday = () => get<Devotional>("/api/v1/today");
export const getDay = (date: string) => get<Devotional>(`/api/v1/day/${encodeURIComponent(date)}`);
export const getTopics = () => get<TopicSummary[]>("/api/v1/topics");
export const getTopic = (slug: string) => get<TopicQA>(`/api/v1/topic/${encodeURIComponent(slug)}`);
export const getArchive = () => get<string[]>("/api/v1/archive");
export const search = (q: string, topic?: string, limit = 10) =>
  get<SearchResult[]>("/api/v1/search", topic ? { q, topic, limit } : { q, limit });
