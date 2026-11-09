import LZ from "lz-string";
import {
  BLACKLIST, CAPTION_TEMPLATES, CO2_PER_KM, FORMAT_BY_ID, LEGAL_TEXT, STYLE_BY_ID,
} from "./constants";
import { hashString } from "./rng";
import type { Doc, FormatId, Layer, Role, StyleId, SymbolId } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 9);
export const certId = () =>
  "IMP-" + Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export const co2For = (km: number) => Math.round(km * CO2_PER_KM * 10) / 10;
export const fmtNum = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
export const fmtDate = (t: number) => new Date(t).toLocaleDateString("it-IT");

// ---------------------------------------------------------------- layout -----
type LayoutRow = [number, number, number, number?]; // x, y, w, size|h
const LAYOUTS: Record<FormatId, Record<Role, LayoutRow>> = {
  square: {
    panel: [540, 540, 968, 968], eyebrow: [540, 150, 700, 21], title: [540, 215, 820, 60], symbol: [540, 335, 130],
    subtitle: [540, 440, 600, 25], name: [540, 510, 840, 68], company: [540, 572, 820, 32], message: [540, 650, 740, 27],
    co2: [430, 775, 520, 92], co2label: [430, 850, 520, 21], qr: [850, 810, 128], footer: [540, 925, 820, 15], legal: [540, 975, 860, 13],
  },
  story: {
    panel: [540, 960, 968, 1720], eyebrow: [540, 235, 800, 24], title: [540, 330, 860, 74], symbol: [540, 540, 230],
    subtitle: [540, 730, 640, 30], name: [540, 820, 900, 84], company: [540, 905, 860, 38], message: [540, 1030, 800, 33],
    co2: [540, 1250, 760, 150], co2label: [540, 1350, 760, 26], qr: [540, 1530, 210], footer: [540, 1680, 860, 18], legal: [540, 1760, 880, 15],
  },
  landscape: {
    panel: [600, 313, 1120, 560], eyebrow: [730, 100, 620, 16], title: [730, 150, 620, 42], symbol: [235, 215, 190],
    subtitle: [730, 205, 620, 18], name: [730, 255, 620, 48], company: [730, 305, 620, 24], message: [730, 370, 540, 19],
    co2: [235, 380, 360, 64], co2label: [235, 430, 340, 16], qr: [1085, 385, 92], footer: [730, 450, 620, 12], legal: [600, 525, 1060, 11],
  },
  a4: {
    panel: [702, 496, 1304, 893], eyebrow: [702, 130, 900, 20], title: [702, 205, 1000, 64], symbol: [180, 420, 200],
    subtitle: [702, 285, 700, 24], name: [702, 365, 1000, 76], company: [702, 430, 900, 34], message: [702, 505, 820, 28],
    co2: [702, 625, 600, 84], co2label: [702, 690, 700, 22], qr: [1235, 620, 150], footer: [702, 780, 1000, 16], legal: [702, 850, 1150, 13],
  },
  ddt: {
    panel: [500, 500, 940, 940], eyebrow: [500, 105, 820, 22], title: [500, 170, 860, 50], symbol: [220, 330, 170],
    subtitle: [500, 430, 500, 20], name: [500, 480, 860, 46], company: [500, 533, 840, 28], message: [500, 600, 800, 24],
    co2: [650, 310, 440, 88], co2label: [650, 380, 420, 20], qr: [230, 755, 160], footer: [650, 745, 420, 22], legal: [500, 905, 860, 12],
  },
};

export function applyLayout(layers: Layer[], format: FormatId): Layer[] {
  const { w: W, h: H } = FORMAT_BY_ID[format];
  return layers.map((l) => {
    if (!l.role) return l;
    const row = LAYOUTS[format][l.role];
    if (!row) return l;
    const [x, y, w, s] = row;
    const base = { ...l, x: x / W, y: y / H, w };
    if (l.role === "panel") return { ...base, h: s };
    if (l.kind === "text" || l.kind === "legal") return { ...base, size: s };
    return base; // symbol / qr
  });
}

const base = (p: Partial<Layer> & Pick<Layer, "kind" | "name">): Layer => ({
  id: uid(), x: 0.5, y: 0.5, w: 200, rot: 0, opacity: 1, locked: false, hidden: false, ...p,
});

export function defaultLayers(format: FormatId, style: StyleId): Layer[] {
  const st = STYLE_BY_ID[style];
  const T = (role: Role, name: string, text: string, extra: Partial<Layer> = {}) =>
    base({ kind: "text", role, name, text, font: st.bodyFont, weight: 400, align: "center", color: "text", lh: 1.15, ls: 0, ...extra });
  const layers: Layer[] = [
    base({ kind: "shape", role: "panel", name: "Pannello", shape: "rect", fill: "bg", stroke: "accent", strokeW: 3, radius: 18, opacity: st.panelOpacity, locked: true }),
    T("eyebrow", "Sopratitolo", "[Promotore] · Welfare Km 0", { weight: 700, ls: 4, caps: true, color: "accent" }),
    T("title", "Titolo", "Attestato di Impatto", { font: st.titleFont, weight: 700 }),
    base({ kind: "symbol", role: "symbol", name: "Simbolo", symbol: "SIMBOL_BIO_LEAF" }),
    T("subtitle", "Sottotitolo", "conferito a", { italic: true, opacity: 0.85 }),
    T("name", "Nome", "[Nome] [Cognome]", { font: st.titleFont, weight: 700 }),
    T("company", "Azienda", "[Nome Azienda CSR]", { weight: 700, color: "accent", ls: 1 }),
    T("message", "Messaggio", "ha scelto prodotti di filiera corta da [Comune Marche], a soli [Km] km di distanza.", { lh: 1.3 }),
    T("co2", "Dato CO2", "[CO2] kg", { font: st.titleFont, weight: 700, color: "accent", lh: 1.05 }),
    T("co2label", "Etichetta CO2", "CO2 equivalente evitata (stima)", { ls: 1.5, caps: true, weight: 700 }),
    base({ kind: "qr", role: "qr", name: "QR di verifica" }),
    T("footer", "Riferimenti", "ID [ID] · [Data]", { ls: 1.5, opacity: 0.75, weight: 700 }),
    base({ kind: "legal", role: "legal", name: "Disclaimer legale", text: LEGAL_TEXT, font: st.bodyFont, weight: 400, align: "center", color: "text", lh: 1.35, opacity: 0.9 }),
  ];
  return applyLayout(layers, format);
}

// -------------------------------------------------------------- creazione -----
export function createDoc(over: {
  first?: string; last?: string; company?: string; city?: string; km?: number; style?: StyleId; symbol?: SymbolId;
  format?: FormatId; id?: string; createdAt?: number; promoter?: string; ddt?: string; seed?: number; master?: boolean;
  colors?: { bg: string; text: string; accent: string };
} = {}): Doc {
  const style = over.style ?? "ART_CEZANNE";
  const st = STYLE_BY_ID[style];
  const format = over.format ?? "square";
  const symbol = over.symbol ?? "SIMBOL_BIO_LEAF";
  const layers = defaultLayers(format, style).map((l) => (l.kind === "symbol" ? { ...l, symbol } : l));
  const colors = over.colors ?? st.colors;
  return {
    id: over.id ?? certId(),
    createdAt: over.createdAt ?? Date.now(),
    title: "Attestato di Impatto",
    user: { first: over.first ?? "Marco", last: over.last ?? "Rossi", company: over.company ?? "Loccioni Group" },
    partners: { promoter: over.promoter ?? "Gruppo Illiria", fleet: "Flotta Illiria Optimised Route", startup: "EcoKm0 Logistics Startup" },
    loc: { city: over.city ?? "Jesi (AN)", km: over.km ?? 55 },
    ddt: over.ddt ?? "",
    design: { style, ...colors, symbol, format, master: over.master ?? true, seed: over.seed ?? Math.floor(Math.random() * 1e9) },
    layers,
    caption: { template: "linkedin", text: CAPTION_TEMPLATES.linkedin.text },
    utm: { campaign: "impatto_km0", content: "certificato" },
  };
}

export function applyStyle(doc: Doc, style: StyleId, keepColors = false): Doc {
  const st = STYLE_BY_ID[style];
  return {
    ...doc,
    design: { ...doc.design, style, master: true, ...(keepColors ? {} : st.colors) },
    layers: doc.layers.map((l) => {
      if (!l.role) return l;
      if (l.role === "panel") return { ...l, opacity: st.panelOpacity };
      if (l.kind === "text" || l.kind === "legal") {
        const heading = l.role === "title" || l.role === "name" || l.role === "co2";
        return { ...l, font: heading ? st.titleFont : st.bodyFont };
      }
      return l;
    }),
  };
}

// ----------------------------------------------------------- placeholder -----
export function placeholderCtx(doc: Doc, link = ""): Record<string, string> {
  const km = doc.loc.km;
  return {
    nome: doc.user.first,
    cognome: doc.user.last,
    "nome azienda csr": doc.user.company,
    "comune marche": doc.loc.city,
    km: String(km),
    co2: fmtNum(co2For(km)),
    "link pagina web": link,
    promotore: doc.partners.promoter,
    data: fmtDate(doc.createdAt),
    id: doc.id,
    ddt: doc.ddt || "—",
  };
}

export function resolveText(text: string, ctx: Record<string, string>) {
  return text.replace(/\[([^\]]+)\]/g, (m, k: string) => {
    const v = ctx[k.trim().toLowerCase()];
    return v === undefined ? m : v;
  });
}

// Grassetto markdown → Unicode "Mathematical Sans-Serif Bold" per i social (che non supportano formattazione)
export function unicodeBold(text: string) {
  const map = (c: string) => {
    const code = c.codePointAt(0)!;
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + code - 65);
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + code - 97);
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + code - 48);
    return c;
  };
  return text.replace(/\*\*([^*]+)\*\*/g, (_, t: string) => Array.from(t).map(map).join(""));
}

// ------------------------------------------------------------ conformità -----
const norm = (s: string) =>
  s.toLowerCase().replace(/\s*%\s*/g, "% ").replace(/[-_.,;:!?'"’]/g, " ").replace(/\s+/g, " ").trim();

export interface Violation { term: string; where: string; origin: "SKILL" | "estesa" }

export function findViolations(doc: Doc): Violation[] {
  const sources: { where: string; text: string }[] = [
    { where: "Nome / Cognome / Azienda", text: `${doc.user.first} ${doc.user.last} ${doc.user.company} ${doc.partners.fleet} ${doc.partners.startup}` },
    { where: "Caption social", text: doc.caption.text },
    ...doc.layers.filter((l) => l.text && l.kind !== "legal").map((l) => ({ where: `Livello «${l.name}»`, text: l.text! })),
    ...doc.layers.filter((l) => l.emoji).map((l) => ({ where: `Livello «${l.name}»`, text: l.emoji! })),
  ];
  const out: Violation[] = [];
  for (const s of sources) {
    const n = norm(s.text);
    for (const b of BLACKLIST) {
      if (n.includes(norm(b.term))) out.push({ term: b.term, where: s.where, origin: b.origin });
    }
  }
  return out;
}

// ------------------------------------------------------------------ link -----
export const baseUrl = () => {
  if (typeof window === "undefined" || typeof window.location === "undefined") return "https://example.org/";
  return window.location.origin + window.location.pathname;
};

export function fingerprint(d: Doc) {
  return hashString([d.id, d.user.first, d.user.last, d.user.company, d.loc.city, d.loc.km].join("|")).slice(0, 8);
}

export interface Compact {
  i: string; t: number; f: string; l: string; c: string; ci: string; k: number; s: StyleId; y: SymbolId;
  b: string; x: string; a: string; sd: number; m: 0 | 1; p: string; d: string; fm: FormatId; h: string;
}

export function toCompact(d: Doc): Compact {
  return {
    i: d.id, t: d.createdAt, f: d.user.first, l: d.user.last, c: d.user.company, ci: d.loc.city, k: d.loc.km,
    s: d.design.style, y: d.design.symbol, b: d.design.bg, x: d.design.text, a: d.design.accent, sd: d.design.seed,
    m: d.design.master ? 1 : 0, p: d.partners.promoter, d: d.ddt, fm: d.design.format, h: fingerprint(d),
  };
}

export function fromCompact(c: Compact): { doc: Doc; valid: boolean } {
  const doc = createDoc({
    id: c.i, createdAt: c.t, first: c.f, last: c.l, company: c.c, city: c.ci, km: c.k, style: c.s, symbol: c.y,
    seed: c.sd, master: !!c.m, promoter: c.p, ddt: c.d, format: c.fm, colors: { bg: c.b, text: c.x, accent: c.a },
  });
  return { doc, valid: fingerprint(doc) === c.h };
}

export function encodeCompact(d: Doc) {
  return LZ.compressToEncodedURIComponent(JSON.stringify(toCompact(d)));
}
export function decodeCompact(s: string): { doc: Doc; valid: boolean } | null {
  try {
    const j = JSON.parse(LZ.decompressFromEncodedURIComponent(s) || "");
    if (!j || !j.i) return null;
    return fromCompact(j as Compact);
  } catch {
    return null;
  }
}

export function encodeFull(d: Doc) {
  const clean = { ...d, layers: d.layers.filter((l) => l.kind !== "image") };
  return LZ.compressToEncodedURIComponent(JSON.stringify(clean));
}
export function decodeFull(s: string): Doc | null {
  try {
    const j = JSON.parse(LZ.decompressFromEncodedURIComponent(s) || "");
    return j && j.layers && j.design ? (j as Doc) : null;
  } catch {
    return null;
  }
}

export interface UtmOpts { source: string; medium: string }
export function utmQuery(doc: Doc, o: UtmOpts) {
  const p = new URLSearchParams({
    utm_source: o.source, utm_medium: o.medium, utm_campaign: doc.utm.campaign || "impatto_km0", utm_content: doc.utm.content || "certificato",
  });
  return p.toString();
}

export function verifyLink(doc: Doc, o: UtmOpts = { source: "direct", medium: "link" }) {
  return `${baseUrl()}?${utmQuery(doc, o)}#/v/${encodeCompact(doc)}`;
}
export function remixLink(doc: Doc) {
  return `${baseUrl()}#/r/${encodeFull(doc)}`;
}
export function appLink(ref?: string) {
  return `${baseUrl()}?utm_source=${ref ?? "invito"}&utm_medium=referral&utm_campaign=impatto_km0#/crea`;
}

// ------------------------------------------------------- factory layer -------
export const newText = (text = "Nuovo testo", over: Partial<Layer> = {}): Layer =>
  base({ kind: "text", name: "Testo", text, w: 600, size: 44, font: "sans", weight: 700, align: "center", color: "text", lh: 1.15, ls: 0, y: 0.5, ...over });
export const newSticker = (emoji: string): Layer => base({ kind: "sticker", name: `Sticker ${emoji}`, emoji, w: 120 });
export const newShape = (shape: "rect" | "circle" | "pill" | "line"): Layer =>
  base({ kind: "shape", name: shape === "line" ? "Linea" : "Forma", shape, w: shape === "line" ? 400 : 240, h: shape === "line" ? 6 : shape === "circle" ? 240 : 140, fill: "accent", radius: 16, opacity: 1 });
export const newSymbolLayer = (symbol: SymbolId): Layer => base({ kind: "symbol", name: "Simbolo extra", symbol, w: 130 });
export const newImage = (src: string, w: number, h: number): Layer => base({ kind: "image", name: "Immagine / Logo", src, w, h });

export function duplicateLayer(l: Layer): Layer {
  return { ...l, id: uid(), role: undefined, name: l.name + " copia", x: Math.min(0.95, l.x + 0.03), y: Math.min(0.95, l.y + 0.03), locked: false };
}

// ------------------------------------------------------------- carosello -----
export function carouselDocs(doc: Doc): Doc[] {
  const sq = FORMAT_BY_ID.square;
  const st = STYLE_BY_ID[doc.design.style];
  const slide1: Doc =
    doc.design.format === "square"
      ? doc
      : { ...doc, design: { ...doc.design, format: "square" }, layers: applyLayout(doc.layers, "square") };
  const f = (x: number, y: number) => ({ x: x / sq.w, y: y / sq.h });
  const panel = defaultLayers("square", doc.design.style).filter((l) => l.role === "panel");
  const legal = defaultLayers("square", doc.design.style).filter((l) => l.role === "legal");
  const T = (name: string, text: string, x: number, y: number, size: number, over: Partial<Layer> = {}) =>
    newText(text, { name, ...f(x, y), w: 840, size, font: st.bodyFont, ...over });
  const slide2: Doc = {
    ...slide1, id: doc.id, layers: [
      ...panel,
      T("Sopratitolo", "Dettaglio impatto · 2/3", 540, 150, 21, { weight: 700, ls: 4, caps: true, color: "accent" }),
      T("Titolo", "Come nasce la stima", 540, 225, 58, { font: st.titleFont }),
      base({ kind: "shape", name: "Rotta", shape: "line", ...f(540, 420), w: 620, h: 6, fill: "accent", radius: 3 }),
      base({ kind: "shape", name: "Hub", shape: "circle", ...f(230, 420), w: 56, h: 56, fill: "accent" }),
      base({ kind: "shape", name: "Destinazione", shape: "circle", ...f(850, 420), w: 56, h: 56, fill: "accent" }),
      T("Km", "[Km] km", 540, 365, 54, { color: "accent", w: 300 }),
      T("Hub", "Hub [Promotore]", 230, 490, 22, { w: 260, weight: 400 }),
      T("Destino", "[Comune Marche]", 850, 490, 22, { w: 260, weight: 400 }),
      T("Formula", "[Km] km × 0,31 kg CO2/km =", 540, 620, 44, { weight: 400 }),
      T("CO2", "[CO2] kg", 540, 730, 130, { font: st.titleFont, color: "accent", lh: 1.05 }),
      T("Etichetta", "CO2 equivalente evitata (stima)", 540, 815, 22, { ls: 1.5, caps: true }),
      T("Nota", "Stima rispetto a consegne singole dedicate, calcolata con un fattore indicativo di 0,31 kg CO2 per km.", 540, 880, 22, { weight: 400, w: 760, lh: 1.3 }),
      ...legal,
    ],
  };
  const slide3: Doc = {
    ...slide1, id: doc.id, layers: [
      ...panel,
      T("Sopratitolo", "Verifica online · 3/3", 540, 150, 21, { weight: 700, ls: 4, caps: true, color: "accent" }),
      T("Nome", "[Nome] [Cognome]", 540, 240, 70, { font: st.titleFont }),
      T("Azienda", "[Nome Azienda CSR]", 540, 315, 32, { color: "accent", ls: 1 }),
      base({ kind: "qr", name: "QR", ...f(540, 565), w: 340 }),
      T("Invito", "Inquadra il QR per verificare l'attestato", 540, 790, 24, { weight: 400 }),
      T("Riferimenti", "ID [ID] · [Data]", 540, 860, 20, { ls: 1.5, weight: 700, opacity: 0.8 }),
      ...legal,
    ],
  };
  return [slide1, slide2, slide3];
}
