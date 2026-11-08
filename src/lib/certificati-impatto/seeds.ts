import { createDoc } from "./doc";
import type { Doc, FormatId, StyleId, SymbolId } from "./types";

const S: [string, string, string, string, number, StyleId, SymbolId, FormatId, number][] = [
  ["Marco", "Rossi", "Loccioni Group", "Jesi (AN)", 55, "ART_CEZANNE", "SIMBOL_MARCHE_HILLS", "square", 11],
  ["Giulia", "Bianchi", "Brembo", "Fabriano (AN)", 48, "ART_PICASSO", "SIMBOL_CSR_HANDSHAKE", "square", 23],
  ["Luca", "Ferretti", "Guzzini", "Macerata (MC)", 62, "ART_MATISSE", "SIMBOL_BIO_LEAF", "story", 37],
  ["Sara", "Conti", "Impresa CSR Partner", "Urbino (PU)", 70, "ART_MONET", "SIMBOL_ECO_FLLEET", "landscape", 41],
  ["Paolo", "Neri", "Loccioni Group", "Senigallia (AN)", 40, "ART_MIRO", "SIMBOL_SEAL_STAMP", "square", 53],
  ["Elena", "Marchetti", "Brembo", "Fermo (FM)", 66, "ART_SCHIELE", "SIMBOL_BIO_LEAF", "a4", 67],
  ["Davide", "Galli", "Guzzini", "Ascoli Piceno (AP)", 70, "ART_BRUEGEL", "SIMBOL_MARCHE_HILLS", "square", 71],
  ["Chiara", "Serra", "Impresa CSR Partner", "Jesi (AN)", 45, "STYLE_CORPORATE_CLEAN", "SIMBOL_CSR_HANDSHAKE", "landscape", 83],
  ["Andrea", "Pace", "Loccioni Group", "Fabriano (AN)", 58, "STYLE_ECO_TECH_DASHBOARD", "SIMBOL_ECO_FLLEET", "square", 97],
  ["Marta", "Gentili", "Guzzini", "Macerata (MC)", 52, "STYLE_BOTANICAL_WATERCOLOR", "SIMBOL_BIO_LEAF", "story", 101],
  ["Franco", "Moretti", "Impresa CSR Partner", "Camerino (MC)", 60, "STYLE_CRAFT_HERITAGE", "SIMBOL_SEAL_STAMP", "ddt", 113],
];

export const EXAMPLES: Doc[] = S.map(([first, last, company, city, km, style, symbol, format, n], i) =>
  createDoc({
    id: `IMP-ES${String(i + 1).padStart(2, "0")}${n}`.slice(0, 10),
    createdAt: new Date(2026, 0, 12 + i * 3).getTime(),
    first, last, company, city, km, style, symbol, format, seed: n * 7919,
    ddt: `2026/${String(100 + n)}`,
  })
);
