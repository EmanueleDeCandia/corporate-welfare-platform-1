import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CertificateSVG } from "@/components/certificati-impatto/CertificateSVG";
import { FORMAT_BY_ID } from "./constants";
import { applyLayout, carouselDocs, verifyLink } from "./doc";
import type { Doc, FormatId } from "./types";

export function svgMarkup(doc: Doc, link?: string) {
  const l = link ?? verifyLink(doc, { source: "qr", medium: "card" });
  return renderToStaticMarkup(createElement(CertificateSVG, { doc, link: l, exact: true }));
}

export async function svgToCanvas(svg: string, w: number, h: number, scale: number, fill?: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d")!;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), type, q));

export async function renderCanvas(doc: Doc, scale?: number, link?: string) {
  const fm = FORMAT_BY_ID[doc.design.format];
  return svgToCanvas(svgMarkup(doc, link), fm.w, fm.h, scale ?? fm.scale, doc.design.bg);
}

export async function exportRaster(doc: Doc, type: "png" | "jpeg", scale?: number) {
  const c = await renderCanvas(doc, scale);
  return toBlob(c, type === "png" ? "image/png" : "image/jpeg", 0.93);
}

export const exportSvg = (doc: Doc) => new Blob([svgMarkup(doc)], { type: "image/svg+xml" });

export function toFormat(doc: Doc, format: FormatId): Doc {
  if (doc.design.format === format) return doc;
  return { ...doc, design: { ...doc.design, format }, layers: applyLayout(doc.layers, format) };
}

export function fileName(doc: Doc, ext: string, suffix = "") {
  const slug = `${doc.user.first}-${doc.user.last}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
  return `certificato-impatto_${slug}_${doc.id}${suffix ? "_" + suffix : ""}.${ext}`;
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function pdfMeta(pdf: import("jspdf").jsPDF, doc: Doc, link: string) {
  pdf.setProperties({
    title: `Certificato di Impatto — ${doc.user.first} ${doc.user.last}`,
    subject: `Filiera corta Km 0 · ${doc.loc.city} · ${doc.loc.km} km`,
    author: doc.partners.promoter,
    keywords: "welfare, km0, CSR, Regione Marche, filiera corta",
    creator: "Certificati di Impatto",
  });
  void link;
}

/** PDF singola pagina (A4 landscape o etichetta 100×100 mm). */
export async function exportPdfSingle(doc: Doc, format: "a4" | "ddt") {
  const d = toFormat(doc, format);
  const link = verifyLink(d, { source: "pdf", medium: "print" });
  const canvas = await renderCanvas(d, format === "a4" ? 2 : 1.6, link);
  const { jsPDF } = await import("jspdf");
  const mm = format === "a4" ? [297, 210] : [100, 100];
  const pdf = new jsPDF({ orientation: format === "a4" ? "landscape" : "portrait", unit: "mm", format: mm });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, mm[0], mm[1], undefined, "FAST");
  const fm = FORMAT_BY_ID[format];
  const qr = d.layers.find((l) => l.kind === "qr" && !l.hidden);
  if (qr) {
    const k = mm[0] / fm.w;
    pdf.link((qr.x * fm.w - qr.w / 2) * k, (qr.y * fm.h - qr.w / 2) * k, qr.w * k, qr.w * k, { url: link });
  }
  await pdfMeta(pdf, d, link);
  return pdf.output("blob");
}

/** PDF carosello 1080×1080 multi-pagina (LinkedIn). */
export async function exportPdfCarousel(doc: Doc) {
  const slides = carouselDocs(toFormat(doc, "square"));
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [1080, 1080], hotfixes: ["px_scaling"] });
  for (let i = 0; i < slides.length; i++) {
    const link = verifyLink(slides[i], { source: "linkedin", medium: "carousel" });
    const c = await renderCanvas(slides[i], 1, link);
    if (i > 0) pdf.addPage([1080, 1080], "portrait");
    pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 1080, 1080, undefined, "FAST");
    const qr = slides[i].layers.find((l) => l.kind === "qr" && !l.hidden);
    if (qr) pdf.link(qr.x * 1080 - qr.w / 2, qr.y * 1080 - qr.w / 2, qr.w, qr.w, { url: link });
  }
  await pdfMeta(pdf, slides[0], "");
  return pdf.output("blob");
}

/** Condivisione nativa (Web Share API) con file immagine, se supportata. */
export async function nativeShare(doc: Doc, text: string, url: string): Promise<"shared" | "unsupported" | "cancelled"> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (!nav.share) return "unsupported";
  try {
    const blob = await exportRaster(doc, "png", 1);
    const file = new File([blob], fileName(doc, "png"), { type: "image/png" });
    const data: ShareData = { title: "Certificato di Impatto Km 0", text, url, files: [file] };
    if (nav.canShare && nav.canShare(data)) await nav.share(data);
    else await nav.share({ title: data.title, text, url });
    return "shared";
  } catch (e) {
    return (e as Error).name === "AbortError" ? "cancelled" : "unsupported";
  }
}
