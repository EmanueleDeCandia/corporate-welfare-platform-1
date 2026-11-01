/**
 * RADICI DESIGN SYSTEM TOKENS
 * 
 * Vincolo architetturale: la piattaforma RADICI adotta un'estetica editoriale,
 * nobile, ispirata ai borghi, alla terra, alla cultura e alla filiera reale.
 * 
 * ZERO colori generici SaaS (purple, blue, emerald, amber, rose, cyan).
 * Esclusivo utilizzo dei token di civiltà rurale e architettonica:
 * - Forest Deep (#12261e) & Forest (#1c3a2e): Inchiostro, rigore e stabilità istituzionale
 * - Olive (#4a5d4e): Foglia d'ulivo, metriche ambientali, note e sottotitoli
 * - Terracotta (#c46238): Calore della terra, laterizio, inviti community, call to action
 * - Gold (#c29b38): Luce teatrale, matching grant promotori, valore culturale
 * - Wine (#7a2e32): Mosto, velluto di palco teatrale, alert discreti
 * - Cream (#fbf7f0), Mist (#f2efe9), White (#ffffff): Superfici naturali
 */

export const RADICI_TOKENS = {
  colors: {
    forest: "#1c3a2e",
    forestDeep: "#12261e",
    olive: "#4a5d4e",
    gold: "#c29b38",
    terracotta: "#c46238",
    wine: "#7a2e32",
    cream: "#fbf7f0",
    mist: "#f2efe9",
    white: "#ffffff",
  },
  typography: {
    serif: "font-serif", // Newsreader / Playfair
    sans: "font-sans",   // Inter
  },
} as const;

export type RadiciRole =
  | "promoter"
  | "csr"
  | "employee"
  | "friend"
  | "provider"
  | "theater";

export const ROLE_DEFINITIONS: Record<
  RadiciRole,
  {
    label: string;
    description: string;
    accent: "forest" | "terracotta" | "gold" | "olive";
  }
> = {
  promoter: {
    label: "Startup Promotrice",
    description: "Startup RADICI · Regia di circuito e Matching Grant",
    accent: "forest",
  },
  csr: {
    label: "Impresa CSR",
    description: "Azienda partner · Finanziamento welfare e rendiconto ESG",
    accent: "forest",
  },
  employee: {
    label: "Dipendente & Famiglia",
    description: "Lavoratore · Voucher welfare, omaggi e libertà di scelta",
    accent: "forest",
  },
  friend: {
    label: "Ospite Community",
    description: "Amico invitato · Micro-sconto 10% e circuito partecipato",
    accent: "terracotta",
  },
  provider: {
    label: "Operatore Rurale",
    description: "Agriturismo, osteria o produttore · Fatturazione diretta 0% commissioni",
    accent: "olive",
  },
  theater: {
    label: "Teatro Storico",
    description: "Botteghino & Sala · Matching Grant culturale della Regione",
    accent: "gold",
  },
};
