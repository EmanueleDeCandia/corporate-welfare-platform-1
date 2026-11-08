import { memo, useMemo } from "react";
import qrcode from "qrcode-generator";
import { Art } from "./Art";
import { SymbolArt } from "./Symbols";
import { StickerIcon } from "./Stickers";
import { FONTS, FORMAT_BY_ID } from "@/lib/certificati-impatto/constants";
import { baseUrl, placeholderCtx, resolveText, verifyLink } from "@/lib/certificati-impatto/doc";
import { layoutText } from "@/lib/certificati-impatto/text";
import type { Doc, Layer } from "@/lib/certificati-impatto/types";

const qrCache = new Map<string, { n: number; d: string }>();
export function qrMatrix(text: string) {
  const hit = qrCache.get(text);
  if (hit) return hit;
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  const v = { n, d };
  if (qrCache.size > 200) qrCache.clear();
  qrCache.set(text, v);
  return v;
}

export function colorOf(c: string | undefined, d: Doc["design"], fallback = "text") {
  const k = c ?? fallback;
  if (k === "text") return d.text;
  if (k === "accent") return d.accent;
  if (k === "bg") return d.bg;
  return k;
}

export function shortLink() {
  return baseUrl().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function layerText(doc: Doc, l: Layer) {
  return resolveText(l.text ?? "", placeholderCtx(doc, shortLink()));
}

function QR({ w, link }: { w: number; link: string }) {
  const { n, d } = qrMatrix(link);
  const pad = w * 0.07;
  const m = (w - pad * 2) / n;
  return (
    <g>
      <rect x={-w / 2} y={-w / 2} width={w} height={w} rx={w * 0.06} fill="#FFFFFF" />
      <path d={d} fill="#111111" transform={`translate(${-w / 2 + pad} ${-w / 2 + pad}) scale(${m})`} shapeRendering="crispEdges" />
    </g>
  );
}

function LayerView({ doc, l, link }: { doc: Doc; l: Layer; link: string }) {
  const d = doc.design;
  switch (l.kind) {
    case "text":
    case "legal": {
      const t = layoutText(l, layerText(doc, l));
      const anchor = l.align === "left" ? "start" : l.align === "right" ? "end" : "middle";
      const x = l.align === "left" ? -l.w / 2 : l.align === "right" ? l.w / 2 : 0;
      const col = colorOf(l.color, d);
      return (
        <g fontFamily={FONTS[l.font ?? "sans"].css} fontSize={t.size} fontWeight={l.weight ?? 400} fontStyle={l.italic ? "italic" : "normal"}
          fill={col} textAnchor={anchor} letterSpacing={l.ls ?? 0}>
          {t.lines.map((line, i) => (
            <text key={i} x={x} y={-t.height / 2 + t.lineH * (i + 0.5)} dominantBaseline="central"
              {...(l.halo ? { stroke: d.bg, strokeWidth: t.size * 0.16, paintOrder: "stroke", strokeLinejoin: "round" as const } : {})}>
              {l.caps ? line.toUpperCase() : line}
            </text>
          ))}
        </g>
      );
    }
    case "symbol":
      return (
        <g transform={`scale(${l.w / 200})`}>
          <SymbolArt id={l.symbol ?? "SIMBOL_BIO_LEAF"} accent={d.accent} ink={d.text} paper={d.bg} />
        </g>
      );
    case "qr":
      return <QR w={l.w} link={link} />;
    case "sticker":
      return (
        <g transform={`scale(${l.w / 24}) translate(-12 -12)`}>
          <StickerIcon id={l.emoji ?? "sprout"} size={24} color={colorOf(l.color, d, "accent")} />
        </g>
      );
    case "image":
      return <image href={l.src} x={-l.w / 2} y={-(l.h ?? l.w) / 2} width={l.w} height={l.h ?? l.w} preserveAspectRatio="xMidYMid meet" />;
    case "shape": {
      const h = l.h ?? l.w;
      const fill = colorOf(l.fill, d, "accent");
      const stroke = l.stroke ? colorOf(l.stroke, d) : "none";
      const common = { fill, stroke, strokeWidth: l.strokeW ?? 0 };
      if (l.shape === "circle") return <ellipse rx={l.w / 2} ry={h / 2} {...common} />;
      const rx = l.shape === "pill" ? Math.min(l.w, h) / 2 : l.shape === "line" ? h / 2 : l.radius ?? 0;
      return <rect x={-l.w / 2} y={-h / 2} width={l.w} height={h} rx={rx} {...common} />;
    }
  }
  return null;
}

export interface CertProps {
  doc: Doc;
  link?: string;
  /** dimensioni CSS esplicite (necessarie per l'export) */
  exact?: boolean;
  hideId?: string | null;
  className?: string;
  title?: string;
}

function CertificateSVGBase({ doc, link, exact, hideId, className, title }: CertProps) {
  const fm = FORMAT_BY_ID[doc.design.format];
  const { w: W, h: H } = fm;
  const qrLink = useMemo(
    () => link ?? verifyLink(doc, { source: "qr", medium: "card" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [link, doc.id, doc.user, doc.loc, doc.design, doc.ddt, doc.partners, doc.utm]
  );
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width={exact ? W : "100%"} height={exact ? H : "100%"}
      className={className} role="img" aria-label={title ?? `Certificato di Impatto di ${doc.user.first} ${doc.user.last}`}
      style={{ display: "block" }}>
      <Art design={doc.design} W={W} H={H} />
      {doc.layers.map((l) =>
        l.hidden || l.id === hideId ? null : (
          <g key={l.id} transform={`translate(${l.x * W} ${l.y * H}) rotate(${l.rot})`} opacity={l.opacity}>
            <LayerView doc={doc} l={l} link={qrLink} />
          </g>
        )
      )}
    </svg>
  );
}

export const CertificateSVG = memo(CertificateSVGBase);
