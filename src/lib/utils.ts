import { createHash, randomBytes } from "crypto";

export const PASSWORD_SALT = "radici-welfare-territoriale-v1";
export const FRIEND_DISCOUNT_RATE = 0.1;

export function hashPassword(password: string) {
  return createHash("sha256").update(`${PASSWORD_SALT}:${password}`).digest("hex");
}

export function verifyPassword(password: string, hash: string) {
  return hashPassword(password) === hash;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function randomCode(prefix: string) {
  return `${prefix}-${randomBytes(4).toString("hex")}`;
}

export function formatEuro(cents: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
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
    hint: "Riscatta, condividi o invita per sbloccare il primo badge.",
  };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
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
    case "restaurant":
      return "Esperienza a tavola";
    default:
      return type;
  }
}

export function voucherTypeLabel(type: string) {
  switch (type) {
    case "hotel":
    case "overnight":
      return "Pernottamento";
    case "aperitivo":
    case "dinner":
      return "Cena / Aperitivo KM 0";
    case "theater":
      return "Omaggio Spettacolo";
    default:
      return type;
  }
}

export function matchesVoucher(venueType: string, voucherType: string) {
  if (voucherType === "theater") return venueType === "theater";
  if (voucherType === "hotel" || voucherType === "overnight") return venueType === "hotel" || venueType === "agriturismo";
  if (voucherType === "aperitivo" || voucherType === "dinner") {
    return venueType === "agriturismo" || venueType === "restaurant" || venueType === "hotel";
  }
  return false;
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

export function servicePrice(
  venue: {
    type: string;
    priceHotelCents: number;
    priceAperitivoCents: number;
    priceShowCents: number;
  },
  service: "hotel" | "aperitivo" | "theater",
) {
  if (service === "hotel") return venue.priceHotelCents;
  if (service === "aperitivo") return venue.priceAperitivoCents;
  return venue.priceShowCents;
}

export function defaultServiceForVenue(type: string): "hotel" | "aperitivo" | "theater" {
  if (type === "theater") return "theater";
  if (type === "restaurant") return "aperitivo";
  return "hotel";
}