import { useRef } from "react";
import { SymbolArt } from "../Symbols";
import { ColorField } from "./ColorPanel";
import { FONTS, FORMAT_BY_ID, PLACEHOLDERS, STICKERS, SYMBOLS } from "@/lib/certificati-impatto/constants";
import { duplicateLayer, newImage, newShape, newSticker, newSymbolLayer, newText } from "@/lib/certificati-impatto/doc";
import type { FontId, Layer } from "@/lib/certificati-impatto/types";
import { Btn, Chip, Section, inputCls, toast } from "../ui";
import type { PanelProps } from "./ContentPanel";

interface Props extends PanelProps {
  selectedId: string | null;
  select: (id: string | null) => void;
}

const REQUIRED = new Set(["legal", "qr"]);
const ICON: Record<string, string> = { text: "T", symbol: "◈", qr: "▦", sticker: "☺", image: "▣", shape: "◼", legal: "§" };

function Num({ label, value, onChange, min, max, step = 1, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <label className="block">
      <span className="mb-0.5 flex justify-between text-[11px] font-semibold uppercase text-stone-500">
        {label}
        <span className="font-mono normal-case text-stone-700">{Math.round(value * 100) / 100}{unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-emerald-700" />
    </label>
  );
}

export function LayersPanel({ doc, update, selectedId, select }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const sel = doc.layers.find((l) => l.id === selectedId) ?? null;
  const fm = FORMAT_BY_ID[doc.design.format];

  const patch = (id: string, p: Partial<Layer>, key?: string) =>
    update((d) => ({ ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, ...p } : l)) }), key ?? `p-${id}-${Object.keys(p).join()}`);
  const add = (l: Layer) => {
    update((d) => ({ ...d, layers: [...d.layers, l] }));
    select(l.id);
  };
  const move = (id: string, dir: 1 | -1) =>
    update((d) => {
      const i = d.layers.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.layers.length) return d;
      const arr = [...d.layers];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, layers: arr };
    });
  const remove = (id: string) => {
    update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }));
    select(null);
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (f.size > 8e6) return toast("Immagine troppo grande (max 8 MB)", "warn");
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 700, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        const src = c.toDataURL(f.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.88);
        const w = Math.min(300, c.width);
        add({ ...newImage(src, w, (w * c.height) / c.width), x: 0.15, y: 0.12 });
        toast("Immagine aggiunta. Non è inclusa nei link di condivisione.");
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(f);
  };

  const colorChoice = (value: string | undefined, onChange: (v: string) => void, label: string) => (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase text-stone-500">{label}</div>
      <div className="mb-1.5 flex gap-1.5">
        {[["text", "Testo"], ["accent", "Accento"], ["bg", "Sfondo"]].map(([k, n]) => (
          <Chip key={k} active={value === k} onClick={() => onChange(k)}>{n}</Chip>
        ))}
      </div>
      <ColorField label="Personalizzato" value={/^#/.test(value ?? "") ? value! : doc.design[(value as "text") || "text"] ?? "#000000"} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Aggiungi elementi">
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" variant="soft" onClick={() => add(newText("Il tuo testo", { color: "text", size: Math.round(fm.w * 0.04) }))}>＋ Testo</Btn>
          <Btn size="sm" variant="soft" onClick={() => add(newShape("rect"))}>▭ Rettangolo</Btn>
          <Btn size="sm" variant="soft" onClick={() => add(newShape("circle"))}>◯ Cerchio</Btn>
          <Btn size="sm" variant="soft" onClick={() => add(newShape("pill"))}>⬭ Pillola</Btn>
          <Btn size="sm" variant="soft" onClick={() => add(newShape("line"))}>— Linea</Btn>
          <Btn size="sm" variant="soft" onClick={() => fileRef.current?.click()}>🖼 Logo / immagine</Btn>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase text-stone-500">Simboli</div>
          <div className="flex gap-1.5">
            {SYMBOLS.map((s) => (
              <button key={s.id} title={s.label} onClick={() => add(newSymbolLayer(s.id))} className="w-11 rounded-lg border border-stone-200 bg-white p-1 hover:border-emerald-600">
                <svg viewBox="-104 -104 208 208"><SymbolArt id={s.id} accent={doc.design.accent} ink={doc.design.text} paper={doc.design.bg} /></svg>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase text-stone-500">Sticker</div>
          <div className="flex flex-wrap gap-1">
            {STICKERS.map((e) => (
              <button key={e} onClick={() => add(newSticker(e))} className="h-9 w-9 rounded-lg border border-stone-200 bg-white text-xl hover:border-emerald-600" aria-label={`Sticker ${e}`}>{e}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section title={`Livelli (${doc.layers.length})`} aside={<span className="text-[11px] text-stone-400">dall'alto in basso</span>}>
        <ul className="space-y-1">
          {[...doc.layers].reverse().map((l) => {
            const req = REQUIRED.has(l.kind);
            return (
              <li key={l.id}
                className={`flex items-center gap-1 rounded-lg border px-1.5 py-1 text-sm ${l.id === selectedId ? "border-sky-500 bg-sky-50" : "border-stone-200 bg-white"} ${l.hidden ? "opacity-50" : ""}`}>
                <button onClick={() => select(l.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-stone-100 text-xs font-bold text-stone-600">{ICON[l.kind]}</span>
                  <span className="truncate">{l.kind === "sticker" ? l.emoji + " " : ""}{l.name}</span>
                </button>
                <button title={l.hidden ? "Mostra" : "Nascondi"} disabled={req} onClick={() => patch(l.id, { hidden: !l.hidden }, "k")} className="px-1 text-xs disabled:opacity-30">{l.hidden ? "🙈" : "👁"}</button>
                <button title={l.locked ? "Sblocca" : "Blocca"} onClick={() => patch(l.id, { locked: !l.locked }, "k")} className="px-1 text-xs">{l.locked ? "🔒" : "🔓"}</button>
                <button title="Porta avanti" onClick={() => move(l.id, 1)} className="px-1 text-xs text-stone-500">▲</button>
                <button title="Porta indietro" onClick={() => move(l.id, -1)} className="px-1 text-xs text-stone-500">▼</button>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-stone-500">QR di verifica e disclaimer legale sono obbligatori e non eliminabili (art. 6 SKILL).</p>
      </Section>

      {sel ? (
        <Section title={`Ispettore · ${sel.name}`}>
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" disabled={REQUIRED.has(sel.kind)} onClick={() => { const c = duplicateLayer(sel); update((d) => ({ ...d, layers: [...d.layers, c] })); select(c.id); }}>⧉ Duplica</Btn>
            <Btn size="sm" onClick={() => patch(sel.id, { x: 0.5 })}>↔ Centra X</Btn>
            <Btn size="sm" onClick={() => patch(sel.id, { y: 0.5 })}>↕ Centra Y</Btn>
            <Btn size="sm" variant="danger" disabled={REQUIRED.has(sel.kind)} onClick={() => remove(sel.id)}>🗑 Elimina</Btn>
          </div>

          {(sel.kind === "text" || sel.kind === "legal") && (
            <>
              {sel.kind === "text" ? (
                <div>
                  <textarea className={inputCls + " min-h-20 font-mono text-xs"} value={sel.text} onChange={(e) => patch(sel.id, { text: e.target.value }, "t-" + sel.id)} aria-label="Testo del livello" />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {PLACEHOLDERS.map((p) => (
                      <button key={p} onClick={() => patch(sel.id, { text: (sel.text ?? "") + (sel.text?.endsWith(" ") ? "" : " ") + p }, "t-" + sel.id)}
                        className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-800 hover:bg-emerald-100">{p}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Testo legale fisso (L. 61/2022 · tracciabilità · stima CO2). Puoi spostarlo e ridimensionarlo ma non modificarlo.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <select className={inputCls} value={sel.font} onChange={(e) => patch(sel.id, { font: e.target.value as FontId })} aria-label="Font">
                  {Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                </select>
                <select className={inputCls} value={sel.weight} onChange={(e) => patch(sel.id, { weight: +e.target.value as 400 | 700 | 900 })} aria-label="Peso">
                  <option value={400}>Regolare</option><option value={700}>Grassetto</option><option value={900}>Nero</option>
                </select>
              </div>
              <Num label="Dimensione" value={sel.size ?? 32} min={sel.kind === "legal" ? 10 : 8} max={260} onChange={(v) => patch(sel.id, { size: v }, "s-" + sel.id)} unit="px" />
              <Num label="Larghezza box" value={sel.w} min={60} max={fm.w} onChange={(v) => patch(sel.id, { w: v }, "w-" + sel.id)} unit="px" />
              <div className="grid grid-cols-2 gap-3">
                <Num label="Interlinea" value={sel.lh ?? 1.15} min={0.9} max={2} step={0.05} onChange={(v) => patch(sel.id, { lh: v }, "lh-" + sel.id)} />
                <Num label="Spaziatura" value={sel.ls ?? 0} min={-2} max={16} step={0.5} onChange={(v) => patch(sel.id, { ls: v }, "ls-" + sel.id)} unit="px" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["left", "center", "right"] as const).map((a) => <Chip key={a} active={sel.align === a} onClick={() => patch(sel.id, { align: a })}>{a === "left" ? "⬅ Sinistra" : a === "center" ? "↔ Centro" : "Destra ➡"}</Chip>)}
                <Chip active={!!sel.italic} onClick={() => patch(sel.id, { italic: !sel.italic })}><i>Corsivo</i></Chip>
                <Chip active={!!sel.caps} onClick={() => patch(sel.id, { caps: !sel.caps })}>MAIUSC</Chip>
                <Chip active={!!sel.halo} onClick={() => patch(sel.id, { halo: !sel.halo })}>Alone</Chip>
              </div>
              {colorChoice(sel.color, (v) => patch(sel.id, { color: v }, "c-" + sel.id), "Colore testo")}
            </>
          )}

          {sel.kind === "symbol" && (
            <div className="flex gap-1.5">
              {SYMBOLS.map((s) => (
                <button key={s.id} onClick={() => patch(sel.id, { symbol: s.id })} className={`w-11 rounded-lg border-2 p-1 ${sel.symbol === s.id ? "border-emerald-700" : "border-stone-200"}`}>
                  <svg viewBox="-104 -104 208 208"><SymbolArt id={s.id} accent={doc.design.accent} ink={doc.design.text} paper={doc.design.bg} /></svg>
                </button>
              ))}
            </div>
          )}

          {sel.kind === "shape" && (
            <>
              {colorChoice(sel.fill, (v) => patch(sel.id, { fill: v }, "f-" + sel.id), "Riempimento")}
              <div className="grid grid-cols-2 gap-3">
                <Num label="Larghezza" value={sel.w} min={4} max={fm.w * 1.2} onChange={(v) => patch(sel.id, { w: v }, "w-" + sel.id)} />
                <Num label="Altezza" value={sel.h ?? sel.w} min={2} max={fm.h * 1.2} onChange={(v) => patch(sel.id, { h: v }, "h-" + sel.id)} />
                <Num label="Angoli" value={sel.radius ?? 0} min={0} max={120} onChange={(v) => patch(sel.id, { radius: v }, "r-" + sel.id)} />
                <Num label="Bordo" value={sel.strokeW ?? 0} min={0} max={24} onChange={(v) => patch(sel.id, { strokeW: v, stroke: sel.stroke ?? "accent" }, "sw-" + sel.id)} />
              </div>
              {(sel.strokeW ?? 0) > 0 && colorChoice(sel.stroke, (v) => patch(sel.id, { stroke: v }, "st-" + sel.id), "Colore bordo")}
            </>
          )}

          {(sel.kind === "symbol" || sel.kind === "qr" || sel.kind === "sticker") && (
            <Num label="Dimensione" value={sel.w} min={30} max={fm.w} onChange={(v) => patch(sel.id, { w: v }, "w-" + sel.id)} unit="px" />
          )}
          {sel.kind === "image" && (
            <Num label="Larghezza" value={sel.w} min={30} max={fm.w} onChange={(v) => patch(sel.id, { w: v, h: ((sel.h ?? sel.w) * v) / sel.w }, "w-" + sel.id)} unit="px" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Num label="Rotazione" value={sel.rot} min={-180} max={180} onChange={(v) => patch(sel.id, { rot: v }, "rot-" + sel.id)} unit="°" />
            <Num label="Opacità" value={sel.opacity} min={0.05} max={1} step={0.05} onChange={(v) => patch(sel.id, { opacity: v }, "op-" + sel.id)} />
          </div>
        </Section>
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
          Seleziona un elemento sulla tela o nell'elenco per modificarlo.<br />
          <span className="text-xs">Doppio clic su un testo per scriverci sopra.</span>
        </p>
      )}
    </div>
  );
}
