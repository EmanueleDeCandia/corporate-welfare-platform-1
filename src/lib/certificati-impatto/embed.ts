// Integrazione iframe: messaggistica verso la finestra padre (CARD_GENERATED, CARD_SHARED, CARD_DOWNLOADED).

export interface EmbedConfig {
  embed: boolean;
  partner: string;
  theme: string;
  company: string;
  first: string;
  last: string;
  parentOrigin: string;
}

export function readEmbedConfig(): EmbedConfig {
  if (typeof window === "undefined") {
    return {
      embed: false,
      partner: "",
      theme: "",
      company: "",
      first: "",
      last: "",
      parentOrigin: "*",
    };
  }
  const q = new URLSearchParams(window.location.search);
  const hashQ = new URLSearchParams(window.location.hash.includes("?") ? window.location.hash.split("?")[1] : "");
  const get = (k: string) => q.get(k) ?? hashQ.get(k) ?? "";
  const inHash = window.location.hash.startsWith("#/widget");
  return {
    embed: inHash || get("embed") === "1" || get("widget") === "1",
    partner: get("partner"),
    theme: get("theme"),
    company: get("company"),
    first: get("first"),
    last: get("last"),
    parentOrigin: get("origin") || "*",
  };
}

export type EmbedEvent = "CARD_GENERATED" | "CARD_SHARED" | "CARD_DOWNLOADED" | "WIDGET_READY";

export function postToParent(cfg: EmbedConfig, type: EmbedEvent, payload: unknown) {
  if (typeof window === "undefined" || window.parent === window) return;
  try {
    window.parent.postMessage({ source: "impatto-km0", type, payload }, cfg.parentOrigin);
  } catch {
    /* ignore */
  }
}
