export type StyleId =
  | "ART_PICASSO" | "ART_CEZANNE" | "ART_SCHIELE" | "ART_MIRO" | "ART_MATISSE" | "ART_BRUEGEL" | "ART_MONET"
  | "STYLE_CORPORATE_CLEAN" | "STYLE_CRAFT_HERITAGE" | "STYLE_ECO_TECH_DASHBOARD" | "STYLE_BOTANICAL_WATERCOLOR";

export type SymbolId =
  | "SIMBOL_ECO_FLLEET" | "SIMBOL_MARCHE_HILLS" | "SIMBOL_BIO_LEAF" | "SIMBOL_CSR_HANDSHAKE" | "SIMBOL_SEAL_STAMP";

export type FormatId = "square" | "story" | "landscape" | "a4" | "ddt";

export type FontId = "serif" | "sans" | "rounded" | "mono" | "display" | "script" | "classic";

export type LayerKind = "text" | "symbol" | "qr" | "sticker" | "image" | "shape" | "legal";

export type Role =
  | "panel" | "eyebrow" | "title" | "symbol" | "subtitle" | "name" | "company"
  | "message" | "co2" | "co2label" | "qr" | "footer" | "legal";

export interface Layer {
  id: string;
  kind: LayerKind;
  role?: Role;
  name: string;
  /** centro come frazione della larghezza/altezza della tela */
  x: number;
  y: number;
  /** larghezza (unità di design). Per symbol/qr/sticker è la dimensione del lato */
  w: number;
  /** altezza (shape/image) */
  h?: number;
  rot: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  // testo
  text?: string;
  font?: FontId;
  size?: number;
  weight?: 400 | 700 | 900;
  italic?: boolean;
  align?: "left" | "center" | "right";
  color?: string; // 'text' | 'accent' | 'bg' | '#RRGGBB'
  lh?: number;
  ls?: number;
  caps?: boolean;
  halo?: boolean;
  // symbol
  symbol?: SymbolId;
  // sticker
  emoji?: string;
  // image
  src?: string;
  // shape
  shape?: "rect" | "circle" | "pill" | "line";
  fill?: string;
  stroke?: string;
  strokeW?: number;
  radius?: number;
}

export interface Doc {
  id: string;
  createdAt: number;
  title: string;
  user: { first: string; last: string; company: string };
  partners: { promoter: string; fleet: string; startup: string };
  loc: { city: string; km: number };
  ddt: string;
  design: {
    style: StyleId;
    bg: string;
    text: string;
    accent: string;
    symbol: SymbolId;
    format: FormatId;
    master: boolean; // colori d'autore dello stile (true) o derivati dai colori personalizzati
    seed: number;
  };
  layers: Layer[];
  caption: { template: "linkedin" | "instagram" | "whatsapp" | "custom"; text: string };
  utm: { campaign: string; content: string };
}

export interface SavedCert {
  doc: Doc;
  example?: boolean;
  likes?: number;
}
