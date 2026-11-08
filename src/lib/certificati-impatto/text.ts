import { FONTS } from "./constants";
import type { Layer } from "./types";

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

function getCtx() {
  if (ctx) return ctx;
  if (typeof document === "undefined") return null;
  ctx = document.createElement("canvas").getContext("2d");
  return ctx;
}

export function fontString(l: Layer, size: number) {
  return `${l.italic ? "italic " : ""}${l.weight ?? 400} ${size}px ${FONTS[l.font ?? "sans"].css}`;
}

export function measureWidth(font: string, text: string, ls = 0) {
  const key = font + "|" + ls + "|" + text;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const c = getCtx();
  let w: number;
  if (c) {
    c.font = font;
    w = c.measureText(text).width + ls * text.length;
  } else {
    const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "16");
    w = text.length * size * 0.52 + ls * text.length;
  }
  if (cache.size > 6000) cache.clear();
  cache.set(key, w);
  return w;
}

export interface TextLayout { lines: string[]; lineH: number; height: number; size: number }

export function layoutText(l: Layer, resolved: string): TextLayout {
  const size = l.size ?? 32;
  const font = fontString(l, size);
  const src = l.caps ? resolved.toUpperCase() : resolved;
  const maxW = Math.max(20, l.w);
  const lines: string[] = [];
  for (const para of src.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) { lines.push(""); continue; }
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (cur && measureWidth(font, t, l.ls ?? 0) > maxW) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    lines.push(cur);
  }
  const lineH = size * (l.lh ?? 1.15);
  return { lines, lineH, height: lines.length * lineH, size };
}

export function layerSize(l: Layer, resolved: string): { w: number; h: number } {
  switch (l.kind) {
    case "text":
    case "legal": {
      const t = layoutText(l, resolved);
      return { w: l.w, h: Math.max(t.height, (l.size ?? 20)) };
    }
    case "shape":
    case "image":
      return { w: l.w, h: l.h ?? l.w };
    default:
      return { w: l.w, h: l.w };
  }
}
