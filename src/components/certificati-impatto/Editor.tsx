import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "./Canvas";
import { ContentPanel } from "./panels/ContentPanel";
import { DesignPanel } from "./panels/DesignPanel";
import { ColorPanel } from "./panels/ColorPanel";
import { LayersPanel } from "./panels/LayersPanel";
import { SharePanel, type Actions } from "./panels/SharePanel";
import { ExportPanel } from "./panels/ExportPanel";
import { Btn, Chip, toast } from "./ui";
import { Edit3, Palette, Contrast, Layers, Share2, Download, Undo2, Redo2, ZoomIn, ZoomOut, Lock, Unlock, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { BLACKLIST, FORMAT_BY_ID, LEGAL_TEXT } from "@/lib/certificati-impatto/constants";
import { co2For, duplicateLayer, findViolations, fmtNum } from "@/lib/certificati-impatto/doc";
import { postToParent, type EmbedConfig } from "@/lib/certificati-impatto/embed";
import { exportRaster } from "@/lib/certificati-impatto/export";
import { apiPayload, linkFor } from "@/lib/certificati-impatto/share";
import { bumpStat, saveDraft } from "@/lib/certificati-impatto/storage";
import { useDocHistory } from "@/lib/certificati-impatto/useHistory";
import type { Doc, Layer } from "@/lib/certificati-impatto/types";

type Tab = "dati" | "stile" | "colori" | "livelli" | "social" | "export";
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dati", label: "Dati", icon: Edit3 },
  { id: "stile", label: "Stile", icon: Palette },
  { id: "colori", label: "Colori", icon: Contrast },
  { id: "livelli", label: "Livelli", icon: Layers },
  { id: "social", label: "Social", icon: Share2 },
  { id: "export", label: "Export", icon: Download },
];
const REQUIRED = new Set(["legal", "qr"]);

interface Props {
  initial: Doc;
  inGallery: boolean;
  embed: EmbedConfig;
  onSave: (d: Doc) => void;
  onNew: () => void;
}

export function Editor({ initial, inGallery, embed, onSave, onNew }: Props) {
  const h = useDocHistory(initial);
  const { doc, update } = h;
  const [tab, setTab] = useState<Tab>("dati");
  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const [savedDoc, setSavedDoc] = useState<Doc | null>(inGallery ? initial : null);
  const saved = savedDoc === doc;
  const generated = useRef(false);

  // autosave bozza
  useEffect(() => {
    const t = setTimeout(() => saveDraft(doc), 500);
    return () => clearTimeout(t);
  }, [doc]);
  const patchLayer = useCallback((id: string, p: Partial<Layer>, key?: string) => {
    update((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, ...p } : l)) }), key);
  }, [update]);

  const violations = useMemo(() => findViolations(doc), [doc]);
  const layer = doc.layers.find((l) => l.id === sel) ?? null;

  const notifyGenerated = useCallback(async (d: Doc) => {
    let image: string | undefined;
    try {
      const blob = await exportRaster(d, "png", 1);
      image = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
    } catch { /* ignore */ }
    postToParent(embed, "CARD_GENERATED", { ...apiPayload(d, []), image_data_url: image, status: "generated" });
  }, [embed]);

  const actions: Actions = useMemo(() => ({
    guard: () => {
      const v = findViolations(doc);
      if (v.length) {
        toast(`Termini vietati rilevati (${v.map((x) => "«" + x.term + "»").join(", ")}). Rimuovili per procedere.`, "err");
        return false;
      }
      return true;
    },
    onShared: (channel, link) => {
      bumpStat("shares");
      postToParent(embed, "CARD_SHARED", { channel, certificate_id: doc.id, verify_url: link, status: "published" });
      if (!generated.current) { generated.current = true; void notifyGenerated(doc); }
    },
    onDownloaded: (kind, name) => {
      bumpStat("downloads");
      postToParent(embed, "CARD_DOWNLOADED", { kind, file_name: name, certificate_id: doc.id, verify_url: linkFor(doc, "direct") });
      if (!generated.current) { generated.current = true; void notifyGenerated(doc); }
    },
  }), [doc, embed, notifyGenerated]);

  const save = () => {
    if (!actions.guard()) return;
    onSave(doc);
    setSavedDoc(doc);
    bumpStat("generated");
    toast("Certificato pubblicato nella galleria ✓");
    void notifyGenerated(doc);
    generated.current = true;
  };

  // scorciatoie
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? h.redo() : h.undo(); return; }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); h.redo(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); save(); return; }
      if (!layer) return;
      const fm = FORMAT_BY_ID[doc.design.format];
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (REQUIRED.has(layer.kind)) return;
        const c = duplicateLayer(layer);
        update((d) => ({ ...d, layers: [...d.layers, c] }));
        setSel(c.id);
      } else if ((e.key === "Delete" || e.key === "Backspace") && !REQUIRED.has(layer.kind)) {
        e.preventDefault();
        update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== layer.id) }));
        setSel(null);
      } else if (e.key === "Escape") setSel(null);
      else if (e.key.startsWith("Arrow") && !layer.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        patchLayer(layer.id, { x: layer.x + dx / fm.w, y: layer.y + dy / fm.h }, "nudge-" + layer.id);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const common = { doc, update };
  const ctxBtn = "rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
      {/* Pannelli */}
      <aside className="order-2 min-w-0 lg:order-1">
        <div className="sticky top-14 z-20 -mx-1 mb-3 flex gap-1 overflow-x-auto rounded-xl bg-stone-100/95 p-1 backdrop-blur" role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${tab === t.id ? "bg-white text-forest shadow" : "text-olive hover:text-forest"}`}>
                <Icon size={14} className="shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        {tab === "dati" && <ContentPanel {...common} />}
        {tab === "stile" && <DesignPanel {...common} />}
        {tab === "colori" && <ColorPanel {...common} />}
        {tab === "livelli" && <LayersPanel {...common} selectedId={sel} select={setSel} />}
        {tab === "social" && <SharePanel {...common} actions={actions} />}
        {tab === "export" && (
          <ExportPanel {...common} actions={actions} onSave={save} onNew={onNew} saved={saved}
            onImport={(d) => { h.reset({ ...d, id: d.id }); setSel(null); }} />
        )}
      </aside>

      {/* Tela */}
      <section className="order-1 min-w-0 lg:sticky lg:top-14 lg:order-2 lg:self-start">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <button className={ctxBtn} onClick={h.undo} disabled={!h.canUndo} title="Annulla (Ctrl+Z)"><Undo2 size={13} className="inline mr-1" /> Annulla</button>
          <button className={ctxBtn} onClick={h.redo} disabled={!h.canRedo} title="Ripeti (Ctrl+Shift+Z)"><Redo2 size={13} className="inline mr-1" /> Ripeti</button>
          <span className="mx-1 h-5 w-px bg-stone-300" />
          <button className={ctxBtn} onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))} aria-label="Riduci zoom">−</button>
          <button className={ctxBtn} onClick={() => setZoom(1)} title="Adatta">{Math.round(zoom * 100)}%</button>
          <button className={ctxBtn} onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))} aria-label="Aumenta zoom">＋</button>
          <span className="mx-1 h-5 w-px bg-stone-300" />
          <Chip active={grid} onClick={() => setGrid(!grid)}>Griglia</Chip>
          <Chip active={safe} onClick={() => setSafe(!safe)}>Area sicura</Chip>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 sm:inline">{fmtNum(co2For(doc.loc.km))} kg CO2 · {doc.loc.km} km</span>
            <Btn size="sm" variant="primary" onClick={save}>{saved ? "Salvato" : "Pubblica"}</Btn>
          </div>
        </div>

        <Canvas doc={doc} selectedId={sel} onSelect={setSel} onPatch={patchLayer} onEndGesture={h.endGesture} grid={grid} safe={safe} zoom={zoom} />

        {/* Barra contestuale */}
        <div className="mt-2 min-h-11 rounded-xl border border-stone-200 bg-white px-3 py-2">
          {layer ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-sky-700">{layer.name}</span>
              {(layer.kind === "text" || layer.kind === "legal") && (
                <>
                  <button className={ctxBtn} onClick={() => patchLayer(layer.id, { size: Math.max(8, (layer.size ?? 32) - 2) }, "q-size")}>A−</button>
                  <button className={ctxBtn} onClick={() => patchLayer(layer.id, { size: (layer.size ?? 32) + 2 }, "q-size")}>A+</button>
                  <button className={ctxBtn + (layer.weight && layer.weight >= 700 ? " !bg-stone-900 !text-white" : "")} onClick={() => patchLayer(layer.id, { weight: layer.weight && layer.weight >= 700 ? 400 : 700 })}><b>B</b></button>
                  <button className={ctxBtn + (layer.italic ? " !bg-stone-900 !text-white" : "")} onClick={() => patchLayer(layer.id, { italic: !layer.italic })}><i>I</i></button>
                  {(["left", "center", "right"] as const).map((a) => (
                    <button key={a} className={ctxBtn + (layer.align === a ? " !bg-stone-900 !text-white" : "")} onClick={() => patchLayer(layer.id, { align: a })}>{a === "left" ? "⇤" : a === "center" ? "↔" : "⇥"}</button>
                  ))}
                  {(["text", "accent", "bg"] as const).map((c) => (
                    <button key={c} title={`Colore ${c}`} onClick={() => patchLayer(layer.id, { color: c })} className={`h-6 w-6 rounded-full border-2 ${layer.color === c ? "border-sky-500" : "border-stone-300"}`} style={{ background: doc.design[c] }} />
                  ))}
                </>
              )}
              <span className="mx-1 h-5 w-px bg-stone-200" />
              <button className={ctxBtn} onClick={() => update((d) => { const i = d.layers.findIndex((l) => l.id === layer.id); if (i >= d.layers.length - 1) return d; const a = [...d.layers]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return { ...d, layers: a }; })}>▲ Avanti</button>
              <button className={ctxBtn} onClick={() => update((d) => { const i = d.layers.findIndex((l) => l.id === layer.id); if (i <= 0) return d; const a = [...d.layers]; [a[i], a[i - 1]] = [a[i - 1], a[i]]; return { ...d, layers: a }; })}>▼ Indietro</button>
              <button className={ctxBtn} onClick={() => patchLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? <Lock size={13} className="text-forest inline" /> : <Unlock size={13} className="text-olive/60 inline" />}</button>
              <button className={ctxBtn} disabled={REQUIRED.has(layer.kind)} onClick={() => { const c = duplicateLayer(layer); update((d) => ({ ...d, layers: [...d.layers, c] })); setSel(c.id); }}><Copy size={13} /></button>
              <button className={ctxBtn + " !text-rose-700"} disabled={REQUIRED.has(layer.kind)} onClick={() => { update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== layer.id) })); setSel(null); }}><Trash2 size={13} /></button>
              <button className={ctxBtn} onClick={() => { setTab("livelli"); }}>Altro…</button>
            </div>
          ) : (
            <p className="text-xs text-stone-500">
              <b>Trascina</b> gli elementi · <b>doppio clic</b> sul testo per scrivere · maniglie per ridimensionare/ruotare · <kbd className="rounded bg-stone-100 px-1">←↑↓→</kbd> spostano (Shift = ×10) · <kbd className="rounded bg-stone-100 px-1">Ctrl+Z</kbd> annulla · <kbd className="rounded bg-stone-100 px-1">Alt</kbd> disattiva le guide magnetiche.
            </p>
          )}
        </div>

        {/* Conformità */}
        <details className={`mt-2 rounded-xl border px-3.5 py-2.5 text-xs bg-white shadow-xs ${violations.length ? "border-stone-400 text-stone-900" : "border-stone-200 text-stone-800"}`} open={violations.length > 0}>
          <summary className="cursor-pointer font-bold text-stone-800 hover:text-stone-950 transition">
            {violations.length ? `⚠ ${violations.length} termine/i vietato/i da correggere` : "✓ Conformità AGCM / L. 61/2022 e D.Lgs. 30/2026: disclaimer presenti, nessun termine vietato."}
          </summary>
          <div className="mt-2.5 space-y-2 text-[10px] leading-relaxed">
            {violations.map((v, i) => (
              <div key={i} className="font-semibold text-stone-900 bg-stone-100 p-1.5 rounded">
                «{v.term}» in <b>{v.where}</b>{v.origin === "estesa" ? " (lista estesa)" : ""}
              </div>
            ))}
            <div className="whitespace-pre-line rounded border border-stone-200 bg-stone-50 p-2.5 text-[10px] text-stone-700 font-mono">
              {LEGAL_TEXT.replace("[DDT]", doc.ddt || "—")}
            </div>
            <div className="text-[10px] text-stone-600 space-y-1">
              <p className="font-medium text-stone-800">
                Termini vietati dal D.Lgs. 30/2026 che recepisce nel Codice del Consumo la direttiva (UE) 2024/825 sulle &quot;asserzioni ambientali&quot;.
              </p>
              <p className="text-stone-600">
                Esempi di green claim vietati: {BLACKLIST.map((b) => `«${b.term}»`).join(" · ")}.
              </p>
              <p className="text-stone-500">
                La Direttiva europea è stata ritirata ma le norme contro il greenwashing sono in vigore in Italia.
              </p>
              <p className="font-bold text-stone-900 pt-0.5">
                Esportazione e condivisione sono bloccate finché sono presenti asserzioni vietate.
              </p>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
