import { useMemo, useRef, useState } from "react";
import { CertificateSVG } from "../CertificateSVG";
import { FORMAT_BY_ID } from "@/lib/certificati-impatto/constants";
import { applyLayout, carouselDocs, decodeFull, remixLink, findViolations } from "@/lib/certificati-impatto/doc";
import { Download, FileText, Image as ImageIcon, Copy, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { downloadBlob, exportPdfCarousel, exportPdfSingle, exportRaster, exportSvg, fileName } from "@/lib/certificati-impatto/export";
import type { Doc } from "@/lib/certificati-impatto/types";
import { Btn, Section, copyText, toast } from "../ui";
import type { PanelProps } from "./ContentPanel";
import type { Actions } from "./SharePanel";

interface Props extends PanelProps {
  actions: Actions;
  onSave: () => void;
  onNew: () => void;
  onImport: (d: Doc) => void;
  saved: boolean;
}

export function ExportPanel({ doc, update, actions, onSave, onNew, onImport, saved }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const file = useRef<HTMLInputElement>(null);
  const fm = FORMAT_BY_ID[doc.design.format];
  const slides = useMemo(() => carouselDocs(doc), [doc]);
  const violations = findViolations(doc);
  const isBlocked = violations.length > 0;

  const run = async (label: string, kind: string, fn: () => Promise<{ blob: Blob; name: string }>) => {
    if (!actions.guard()) return;
    setBusy(label);
    try {
      const { blob, name } = await fn();
      downloadBlob(blob, name);
      actions.onDownloaded(kind, name);
      toast(`${label} scaricato`);
    } catch (e) {
      console.error(e);
      toast("Errore durante l'esportazione: " + (e as Error).message, "err");
    } finally {
      setBusy(null);
    }
  };

  const pxLabel = `${Math.round(fm.w * fm.scale * scale)}×${Math.round(fm.h * fm.scale * scale)} px`;

  return (
    <div className="space-y-4">
      <Section title="Salva e condividi il lavoro">
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="primary" onClick={onSave} className="col-span-2">{saved ? "Aggiorna nella galleria" : "Pubblica in galleria"}</Btn>
          <Btn onClick={onNew}>nuovo attestato</Btn>
          <Btn onClick={() => update((d) => ({ ...d, layers: applyLayout(d.layers, d.design.format) }))}>Ripristina layout</Btn>
        </div>
        <p className="text-xs text-stone-500">La galleria è salvata solo su questo dispositivo (nessun database). Usa il link «remix» o il file JSON per spostare il lavoro.</p>
      </Section>

            {isBlocked && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={15} className="text-rose-700" />
            <span>Esportazione e condivisione bloccate</span>
          </div>
          <p className="text-[11px] text-rose-800">
            Rimuovi i green claim vietati ({violations.map((v) => `«${v.term}»`).join(", ")}) per abilitare il download e la condivisione.
          </p>
        </div>
      )}

      <Section title="Immagini">
        <div className="flex items-center justify-between text-xs text-stone-600">
          <span>Formato: <b>{fm.label}</b> · {pxLabel}</span>
          <select value={scale} onChange={(e) => setScale(+e.target.value)} className="rounded border border-stone-300 px-1.5 py-1 text-xs" aria-label="Risoluzione">
            <option value={1}>Qualità 1×</option><option value={1.5}>1.5×</option><option value={2}>Retina 2×</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Btn disabled={!!busy || isBlocked} onClick={() => run("PNG", "PNG", async () => ({ blob: await exportRaster(doc, "png", fm.scale * scale), name: fileName(doc, "png") }))}>PNG</Btn>
          <Btn disabled={!!busy || isBlocked} onClick={() => run("JPEG", "JPEG", async () => ({ blob: await exportRaster(doc, "jpeg", fm.scale * scale), name: fileName(doc, "jpg") }))}>JPEG</Btn>
          <Btn disabled={!!busy || isBlocked} onClick={() => run("SVG", "SVG", async () => ({ blob: exportSvg(doc), name: fileName(doc, "svg") }))}>SVG</Btn>
        </div>
      </Section>

      <Section title="Documenti PDF">
        <div className="grid grid-cols-1 gap-2">
          <Btn disabled={!!busy || isBlocked} onClick={() => run("PDF A4", "PDF_A4", async () => ({ blob: await exportPdfSingle(doc, "a4"), name: fileName(doc, "pdf", "A4") }))}><FileText size={14} className="mr-1 inline" /> Attestato A4 orizzontale (PDF, QR cliccabile)</Btn>
          <Btn disabled={!!busy || isBlocked} onClick={() => run("PDF badge", "PDF_LABEL", async () => ({ blob: await exportPdfSingle(doc, "ddt"), name: fileName(doc, "pdf", "badge-DDT") }))}><FileText size={14} className="mr-1 inline" /> Badge DDT 100×100 mm (PDF)</Btn>
          <Btn disabled={!!busy || isBlocked} variant="primary" onClick={() => run("Carosello PDF", "PDF_CAROUSEL", async () => ({ blob: await exportPdfCarousel(doc), name: fileName(doc, "pdf", "carosello") }))}><Copy size={14} className="mr-1 inline" /> Carosello LinkedIn 3 slide (PDF 1080×1080)</Btn>
        </div>
        {busy && <p className="text-xs text-emerald-700">Generazione di {busy}…</p>}
        <div className="grid grid-cols-3 gap-2">
          {slides.map((s, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-stone-200 shadow-sm">
              <CertificateSVG doc={s} />
              <div className="bg-stone-50 py-0.5 text-center text-[10px] text-stone-500">{["Card d'autore", "CO2 & rotta", "Attestato + QR"][i]}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Portabilità (senza database)">
        <div className="grid grid-cols-1 gap-2">
          <Btn onClick={() => copyText(remixLink(doc))}><Copy size={14} className="mr-1 inline" /> Copia link «remix» (apre questo design modificabile)</Btn>
          <Btn onClick={() => downloadBlob(new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" }), fileName(doc, "json"))}><Download size={14} className="mr-1 inline" /> Esporta progetto JSON</Btn>
          <Btn onClick={() => file.current?.click()}><RefreshCw size={14} className="mr-1 inline" /> Importa progetto JSON</Btn>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const j = JSON.parse(await f.text());
              if (j.layers && j.design) { onImport(j as Doc); toast("Progetto importato"); }
              else {
                const d = typeof j === "string" ? decodeFull(j) : null;
                if (d) onImport(d); else toast("File non valido", "err");
              }
            } catch { toast("File non valido", "err"); }
          }} />
        </div>
      </Section>
    </div>
  );
}
