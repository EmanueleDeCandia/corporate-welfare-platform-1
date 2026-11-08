import type { Doc, SavedCert } from "./types";

const K_CERTS = "impatto.certs.v1";
const K_DRAFT = "impatto.draft.v1";
const K_STATS = "impatto.stats.v1";
const K_LIKES = "impatto.likes.v1";
const K_RECENT = "impatto.recent.v1";
const K_BACKEND = "impatto.backend.v1";

function read<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

export const loadCerts = () => read<SavedCert[]>(K_CERTS, []);
export const saveCerts = (c: SavedCert[]) => write(K_CERTS, c);
export const loadDraft = () => read<Doc | null>(K_DRAFT, null);
export const saveDraft = (d: Doc) => write(K_DRAFT, d);
export const clearDraft = () => localStorage.removeItem(K_DRAFT);

export interface Stats { shares: number; downloads: number; generated: number }
export const loadStats = () => read<Stats>(K_STATS, { shares: 0, downloads: 0, generated: 0 });
export function bumpStat(k: keyof Stats) {
  const s = loadStats();
  s[k]++;
  write(K_STATS, s);
  return s;
}

export const loadLikes = () => read<Record<string, number>>(K_LIKES, {});
export const saveLikes = (l: Record<string, number>) => write(K_LIKES, l);

export const loadRecent = () => read<string[]>(K_RECENT, []);
export function pushRecent(c: string) {
  const r = [c, ...loadRecent().filter((x) => x !== c)].slice(0, 10);
  write(K_RECENT, r);
  return r;
}

export const loadBackend = () => read<string>(K_BACKEND, "");
export const saveBackend = (s: string) => write(K_BACKEND, s);
