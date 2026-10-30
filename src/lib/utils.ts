import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { BenefitType } from "@/db/schema";

const LEGACY_PASSWORD_SALT = "radici-welfare-territoriale-v1";
const SCRYPT_KEYLEN = 32;

export const FRIEND_DISCOUNT_RATE = 0.1;
export const DEFAULT_FRIEND_DISCOUNT_BPS = 1000;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("scrypt$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const next = scryptSync(password, salt, SCRYPT_KEYLEN);
    const prev = Buffer.from(hash, "hex");
    if (next.length !== prev.length) return false;
    return timingSafeEqual(next, prev);
  }
  const legacy = createHash("sha256").update(`${LEGACY_PASSWORD_SALT}:${password}`).digest("hex");
  return legacy === stored;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function randomCode(prefix: string) {
  return `${prefix}-${randomBytes(4).toString("hex")}`;
}

const DISPLAY_TIME_ZONE = "Europe/Rome";
const MONTHS_IT_SHORT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MONTHS_IT_LONG = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

function asDate(value: Date | string | number) {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value < 1e12 ? value * 1000 : value);
  return new Date(value);
}

function romeParts(value: Date | string | number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(asDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: get("day"),
    month: Number(get("month")),
    year: get("year"),
    hour: get("hour").padStart(2, "0"),
    minute: get("minute").padStart(2, "0"),
  };
}

export function formatEuro(cents: number) {
  const amount = Number(cents);
  if (!Number.isFinite(amount)) return "0,00\u00A0\u20AC";
  const negative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${grouped},${rest}\u00A0\u20AC`;
}

export function formatDate(date: Date | string | number) {
  const parts = romeParts(date);
  const month = MONTHS_IT_LONG[parts.month - 1] ?? "";
  return `${parts.day} ${month} ${parts.year}`;
}

export function formatDateTime(date: Date | string | number) {
  const parts = romeParts(date);
  const month = MONTHS_IT_SHORT[parts.month - 1] ?? "";
  return `${parts.day} ${month} ${parts.year}, ${parts.hour}:${parts.minute}`;
}

export function badgeForPoints(points: number) {
  if (points >= 15) {
    return {
      key: "custode",
      label: "Custode del Territorio",
      next: null,
      threshold: 15,
      hint: "Hai raggiunto il livello massimo di cittadinanza attiva.",
    };
  }
  if (points >= 8) {
    return {
      key: "ambassador",
      label: "Ambassador Locale",
      next: "Custode del Territorio",
      threshold: 15,
      hint: "Ancora pochi punti per diventare Custode del Territorio.",
    };
  }
  if (points >= 3) {
    return {
      key: "green",
      label: "Sostenitore Green",
      next: "Ambassador Locale",
      threshold: 8,
      hint: "Condividi e invita amici per diventare Ambassador Locale.",
    };
  }
  return {
    key: "explorer",
    label: "Esploratore",
    next: "Sostenitore Green",
    threshold: 3,
    hint: "Seleziona un voucher, condividi o invita per sbloccare il primo badge.",
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function venueTypeLabel(type: string) {
  switch (type) {
    case "hotel":
      return "Hotel Partner";
    case "agriturismo":
      return "Agriturismo Gusto";
    case "theater":
      return "Teatro / Spettacolo";
    case "show_venue":
      return "Luogo di spettacolo";
    case "restaurant":
      return "Esperienza a tavola";
    default:
      return type;
  }
}

export function voucherTypeLabel(type: string) {
  switch (type) {
    case "overnight":
    case "hotel":
      return "Pernottamento";
    case "dinner":
    case "aperitivo":
      return "Cena KM 0";
    case "theater":
      return "Spettacolo";
    default:
      return type;
  }
}

export function voucherStatusLabel(status: string) {
  switch (status) {
    case "assigned":
      return "Assegnato";
    case "selected":
      return "Selezionato";
    case "attended":
      return "Presente";
    case "no_show":
      return "Non presentato";
    case "expired":
      return "Scaduto";
    default:
      return status;
  }
}

export function paymentStatusLabel(status: string) {
  switch (status) {
    case "settled":
      return "Saldato";
    case "pending":
      return "In attesa di pagamento";
    default:
      return status;
  }
}

export function grantStatusLabel(status: string) {
  switch (status) {
    case "assigned":
      return "Assegnato";
    case "confirmation_sent":
      return "Conferma richiesta";
    case "confirmed":
      return "Confermato";
    case "declined":
      return "Rinunciato";
    case "expired":
      return "Scaduto";
    case "attended":
      return "Presente";
    case "no_show":
      return "Assente";
    default:
      return status;
  }
}

export function isBenefitType(value: string): value is BenefitType {
  return value === "overnight" || value === "dinner";
}

export function normalizeBenefitType(value: string): BenefitType | null {
  if (value === "overnight" || value === "hotel") return "overnight";
  if (value === "dinner" || value === "aperitivo") return "dinner";
  return null;
}

export function appUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}${path}`;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter((part) => part.length > 1 && part !== "S.p.A." && part !== "S.r.l.")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function isDemoMode() {
  return process.env.DEMO_MODE !== "false";
}

export function unixSeconds(date = new Date()) {
  return Math.floor(date.getTime() / 1000);
}
