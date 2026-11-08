import type { FontId, FormatId, StyleId, SymbolId } from "./types";

export const CO2_PER_KM = 0.31;
export const KM_MIN = 40;
export const KM_MAX = 70;

export interface StyleDef {
  id: StyleId;
  label: string;
  sub: string;
  group: "maestri" | "corporate";
  colors: { bg: string; text: string; accent: string };
  palette: string[];
  titleFont: FontId;
  bodyFont: FontId;
  panelOpacity: number;
}

export const STYLES: StyleDef[] = [
  { id: "ART_CEZANNE", label: "Cézanne", sub: "Post-Impressionismo · colline marchigiane", group: "maestri",
    colors: { bg: "#F3E6CC", text: "#3B2A1A", accent: "#3E6B48" },
    palette: ["#C98B3C", "#8C4A2F", "#3E6B48", "#D8B98A", "#5C7F8F"], titleFont: "serif", bodyFont: "serif", panelOpacity: 0.8 },
  { id: "ART_PICASSO", label: "Picasso", sub: "Cubismo · geometria espressiva", group: "maestri",
    colors: { bg: "#F1E7D3", text: "#1B1B1B", accent: "#C8553D" },
    palette: ["#C8553D", "#E8B04B", "#2B4C7E", "#1B1B1B", "#8AA29E"], titleFont: "display", bodyFont: "sans", panelOpacity: 0.8 },
  { id: "ART_SCHIELE", label: "Schiele", sub: "Espressionismo lineare · contorni marcati", group: "maestri",
    colors: { bg: "#EFE6D8", text: "#1A1A1A", accent: "#B3261E" },
    palette: ["#B3261E", "#1A1A1A", "#D9A441", "#6B4F3A", "#8E8E7A"], titleFont: "classic", bodyFont: "mono", panelOpacity: 0.84 },
  { id: "ART_MIRO", label: "Miró", sub: "Surrealismo astratto · simboli fluttuanti", group: "maestri",
    colors: { bg: "#F6F1E7", text: "#111111", accent: "#D62828" },
    palette: ["#D62828", "#1D4ED8", "#FACC15", "#111111", "#16A34A"], titleFont: "rounded", bodyFont: "rounded", panelOpacity: 0.8 },
  { id: "ART_MATISSE", label: "Matisse", sub: "Fauvismo · cut-out organici", group: "maestri",
    colors: { bg: "#FFF6E5", text: "#10265E", accent: "#E8590C" },
    palette: ["#1D4ED8", "#F97316", "#D946EF", "#16A34A", "#FACC15"], titleFont: "rounded", bodyFont: "sans", panelOpacity: 0.82 },
  { id: "ART_BRUEGEL", label: "Bruegel", sub: "Rinascimento fiammingo · campagna rustica", group: "maestri",
    colors: { bg: "#EAD9B5", text: "#3A2412", accent: "#8A4B1F" },
    palette: ["#A0522D", "#D2A24C", "#6B7F3A", "#7A4B2A", "#C9B28A"], titleFont: "classic", bodyFont: "classic", panelOpacity: 0.82 },
  { id: "ART_MONET", label: "Monet", sub: "Impressionismo · luce en plein air", group: "maestri",
    colors: { bg: "#EEF3FA", text: "#2B3A67", accent: "#7B6BB8" },
    palette: ["#B9A7E0", "#8FD3C7", "#F4B6C2", "#9CC9F2", "#F7E7A9"], titleFont: "classic", bodyFont: "serif", panelOpacity: 0.78 },
  { id: "STYLE_CORPORATE_CLEAN", label: "Corporate Clean", sub: "Pulito, istituzionale", group: "corporate",
    colors: { bg: "#FFFFFF", text: "#0F172A", accent: "#0F766E" },
    palette: ["#0F766E", "#14B8A6", "#0EA5E9", "#64748B", "#E2E8F0"], titleFont: "sans", bodyFont: "sans", panelOpacity: 0.9 },
  { id: "STYLE_CRAFT_HERITAGE", label: "Craft Heritage", sub: "Carta kraft · tradizione artigiana", group: "corporate",
    colors: { bg: "#E4CFA6", text: "#3E2A14", accent: "#8B3A1A" },
    palette: ["#8B5E34", "#C69C6D", "#5B3A1E", "#E6D3B3", "#3E6B48"], titleFont: "classic", bodyFont: "serif", panelOpacity: 0.55 },
  { id: "STYLE_ECO_TECH_DASHBOARD", label: "Eco-Tech Dashboard", sub: "Dati, griglie, indicatori", group: "corporate",
    colors: { bg: "#0B1F1A", text: "#E6FFF5", accent: "#2ECC71" },
    palette: ["#22D3EE", "#34D399", "#A3E635", "#0EA5E9", "#1E293B"], titleFont: "mono", bodyFont: "sans", panelOpacity: 0.78 },
  { id: "STYLE_BOTANICAL_WATERCOLOR", label: "Botanical Watercolor", sub: "Acquerello botanico", group: "corporate",
    colors: { bg: "#F7F3EA", text: "#2F4A3A", accent: "#4C8C63" },
    palette: ["#6BAA75", "#A8D5BA", "#E9A8A0", "#F4D58D", "#3C6E57"], titleFont: "script", bodyFont: "serif", panelOpacity: 0.78 },
];

export const STYLE_BY_ID = Object.fromEntries(STYLES.map((s) => [s.id, s])) as Record<StyleId, StyleDef>;

export const PRESETS: { id: string; label: string; bg: string; text: string; accent: string }[] = [
  { id: "smeraldo", label: "Smeraldo Eco", bg: "#0A4D3C", text: "#FFFFFF", accent: "#2ECC71" },
  { id: "kraft", label: "Kraft Naturale", bg: "#E4CFA6", text: "#3E2A14", accent: "#8B3A1A" },
  { id: "dark", label: "Dark Tech", bg: "#0B1220", text: "#E2E8F0", accent: "#22D3EE" },
  { id: "mono", label: "Monocromo", bg: "#FFFFFF", text: "#111111", accent: "#555555" },
  { id: "pastello", label: "Pastello", bg: "#FDF2F8", text: "#4A3B5C", accent: "#C084FC" },
  { id: "terra", label: "Terra di Siena", bg: "#F6E9D7", text: "#4A2A16", accent: "#B4552D" },
  { id: "adriatico", label: "Adriatico", bg: "#E8F4FA", text: "#0B3954", accent: "#0F8BB5" },
  { id: "ulivo", label: "Ulivo", bg: "#F1F0E2", text: "#2D3B1F", accent: "#6B8E23" },
];

export interface SymbolDef { id: SymbolId; label: string; sub: string }
export const SYMBOLS: SymbolDef[] = [
  { id: "SIMBOL_BIO_LEAF", label: "Foglia & spiga", sub: "Filiera corta Km 0" },
  { id: "SIMBOL_MARCHE_HILLS", label: "Colline Marche", sub: "Borghi e paesaggio" },
  { id: "SIMBOL_ECO_FLLEET", label: "Flotta elettrica", sub: "Logistica Illiria" },
  { id: "SIMBOL_CSR_HANDSHAKE", label: "Scudo CSR", sub: "Stretta di mano & welfare" },
  { id: "SIMBOL_SEAL_STAMP", label: "Sigillo", sub: "Timbro di tracciabilità" },
];

export const CITIES = [
  "Jesi (AN)", "Macerata (MC)", "Urbino (PU)", "Ascoli Piceno (AP)", "Fermo (FM)", "Fabriano (AN)", "Senigallia (AN)",
  "Ancona (AN)", "Pesaro (PU)", "Osimo (AN)", "Camerino (MC)", "Recanati (MC)", "San Benedetto del Tronto (AP)", "Cingoli (MC)",
];

export const COMPANIES = ["Loccioni Group", "Brembo", "Guzzini", "Impresa CSR Partner"];

export interface FormatDef {
  id: FormatId;
  fmtId: string;
  label: string;
  sub: string;
  w: number;
  h: number;
  /** pixel finali per export PNG/JPEG (scala applicata al viewBox) */
  scale: number;
  use: string;
}
export const FORMATS: FormatDef[] = [
  { id: "square", fmtId: "FMT_IMG_SQUARE_1:1", label: "Quadrato 1:1", sub: "1080×1080", w: 1080, h: 1080, scale: 1, use: "Instagram, Facebook, LinkedIn, WhatsApp" },
  { id: "story", fmtId: "FMT_IMG_VERTICAL_9:16", label: "Story 9:16", sub: "1080×1920", w: 1080, h: 1920, scale: 1, use: "Stories, Reels, Stato WhatsApp" },
  { id: "landscape", fmtId: "FMT_IMG_LANDSCAPE_16:9", label: "Link 1.91:1", sub: "1200×627", w: 1200, h: 627, scale: 1, use: "LinkedIn link post, X, Open Graph" },
  { id: "a4", fmtId: "FMT_CERT_A4", label: "Attestato A4", sub: "297×210 mm", w: 1404, h: 993, scale: 2, use: "Stampa PDF, Report CSR" },
  { id: "ddt", fmtId: "FMT_LABEL_DDT", label: "Badge DDT", sub: "100×100 mm", w: 1000, h: 1000, scale: 1.2, use: "Etichetta imballi e DDT" },
];
export const FORMAT_BY_ID = Object.fromEntries(FORMATS.map((f) => [f.id, f])) as Record<FormatId, FormatDef>;

export const FONTS: Record<FontId, { label: string; css: string }> = {
  serif: { label: "Radici Serif (Newsreader / Playfair)", css: '"Newsreader", "Playfair Display", Georgia, Cambria, serif' },
  classic: { label: "Palatino (classico)", css: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif' },
  sans: { label: "Inter (sans)", css: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  rounded: { label: "Trebuchet (umanista)", css: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
  mono: { label: "Courier (mono)", css: '"Courier New", Courier, monospace' },
  display: { label: "Impact (display)", css: 'Impact, "Arial Black", "Helvetica Neue", sans-serif' },
  script: { label: "Corsivo", css: '"Brush Script MT", "Segoe Script", "Snell Roundhand", cursive' },
};

export const STICKERS = ["🌱", "🌿", "🍃", "🌾", "🌻", "🍇", "🫒", "🍅", "🧀", "🥖", "🚚", "⚡", "🌍", "♻️", "🤝", "🏆", "⭐", "💚", "🏔️", "🏘️", "🌅", "🐝", "🦋", "🎉"];

// ---- Conformità -------------------------------------------------------------
export const LEGAL_KM0 = "Prodotto a Km 0 (ai sensi della L. 17 maggio 2022, n. 61)";
export const LEGAL_LOGISTICS = "Attestazione firmata dal Produttore Km 0 di tracciabilità del percorso su rotta ottimizzata flotta.";
export const LEGAL_CO2 = "Stima CO2 equivalente evitata rispetto a consegne singole dedicate (DDT n. [DDT] / Registro Magazzino)";
export const LEGAL_TEXT = [LEGAL_KM0, LEGAL_LOGISTICS, LEGAL_CO2].join("\n");

export const BLACKLIST: { term: string; origin: "SKILL" | "estesa" }[] = [
  { term: "100% eco", origin: "SKILL" },
  { term: "zero emissioni", origin: "SKILL" },
  { term: "impatto azzerato", origin: "SKILL" },
  { term: "prodotto certificato green agcm", origin: "SKILL" },
  { term: "impatto zero", origin: "estesa" },
  { term: "carbon neutral", origin: "estesa" },
  { term: "100% green", origin: "estesa" },
  { term: "a emissioni zero", origin: "estesa" },
  { term: "totalmente sostenibile", origin: "estesa" },
];

export const PLACEHOLDERS = [
  "[Nome]", "[Cognome]", "[Nome Azienda CSR]", "[Comune Marche]", "[Km]", "[CO2]", "[Link Pagina Web]",
  "[Promotore]", "[Data]", "[ID]", "[DDT]",
];

export const HASHTAGS = "#WelfareAziendale #Km0 #RegioneMarche #GruppoIlliria #CSR";

export const CAPTION_TEMPLATES: Record<"linkedin" | "instagram" | "whatsapp", { label: string; text: string; limit: number }> = {
  linkedin: {
    label: "LinkedIn · Corporate Welfare & CSR",
    limit: 3000,
    text:
      "**Welfare aziendale a filiera corta: un impegno concreto per il nostro territorio.**\n\n" +
      "Io, [Nome] [Cognome], insieme a [Nome Azienda CSR], ho scelto i prodotti a Km 0 della Regione Marche consegnati da [Comune Marche] con la flotta di [Promotore] su rotta ottimizzata: [Km] km di filiera corta e una stima di [CO2] kg di CO2 equivalente evitata rispetto a consegne singole dedicate.\n\n" +
      "Prodotti a Km 0 ai sensi della L. 17 maggio 2022, n. 61. Il valore è una stima calcolata con fattore emissivo di 0,31 kg CO2/km.\n\n" +
      "👉 **Verifica il certificato e scopri il circuito RADICI:**\n[Link Pagina Web]\n\n" +
      "Vuoi attivare il welfare aziendale a Km 0 anche nella tua impresa o entrare nella nostra rete di produttori e partner locali? Richiedi informazioni o registrati sulla piattaforma!\n\n" +
      "#WelfareAziendale #Km0 #RegioneMarche #GruppoIlliria #CSR #SostenibilitaTerritoriale",
  },
  instagram: {
    label: "Instagram & Facebook · Visual & Engagement",
    limit: 2200,
    text:
      "🌱 Il mio Certificato di Impatto Km 0 è pronto!\n\n" +
      "Da [Comune Marche] alla mia tavola: solo [Km] km di filiera corta e circa [CO2] kg di CO2 equivalente evitata 🚚💚\n\n" +
      "Con [Nome Azienda CSR] e [Promotore] sosteniamo i produttori locali e l'economia delle Marche.\n\n" +
      "👉 Guarda il mio attestato verificato: [Link Pagina Web]\n\n" +
      "✨ Vuoi unirti al circuito RADICI o proporre il welfare a Km 0 nella tua azienda? Clicca sul link per iscriverti o richiedere una presentazione gratuita!",
  },
  whatsapp: {
    label: "WhatsApp · Messaggio diretto",
    limit: 1000,
    text:
      "Ciao! 👋 Sono [Nome]: ho appena creato il mio Certificato di Impatto Km 0 con [Nome Azienda CSR] — [Km] km da [Comune Marche] e circa [CO2] kg di CO2 evitata 🌱\n\n" +
      "Guarda il mio attestato: [Link Pagina Web]\n\n" +
      "Unisciti anche tu al circuito RADICI o scopri come attivare il welfare a filiera corta nella tua azienda: clicca sul link per iscriverti o chiedere informazioni!",
  },
};

export const CHANNELS = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "WHATSAPP"] as const;
