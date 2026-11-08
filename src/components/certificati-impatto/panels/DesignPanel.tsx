import { useState } from "react";
import { Art } from "../Art";
import { SymbolArt } from "../Symbols";
import { FORMATS, STYLES, SYMBOLS } from "@/lib/certificati-impatto/constants";
import { applyLayout, applyStyle } from "@/lib/certificati-impatto/doc";
import type { FormatId, StyleId, SymbolId } from "@/lib/certificati-impatto/types";
import { Btn, Section } from "../ui";
import type { PanelProps } from "./ContentPanel";

export function DesignPanel({ doc, update }: PanelProps) {
  const [keep, setKeep] = useState(false);
  const d = doc.design;
  const setStyle = (id: StyleId) => update((x) => applyStyle(x, id, keep));
  const setSymbol = (id: SymbolId) =>
    update((x) => ({ ...x, design: { ...x.design, symbol: id }, layers: x.layers.map((l) => (l.role === "symbol" ? { ...l, symbol: id } : l)) }));
  const setFormat = (f: FormatId) => update((x) => ({ ...x, design: { ...x.design, format: f }, layers: applyLayout(x.layers, f) }));

  const grid = (group: "maestri" | "corporate") => (
    <div className="grid grid-cols-2 gap-2.5">
      {STYLES.filter((s) => s.group === group).map((s) => (
        <button key={s.id} onClick={() => setStyle(s.id)} aria-pressed={d.style === s.id}
          className={`group overflow-hidden rounded-xl border-2 text-left transition ${d.style === s.id ? "border-emerald-700 shadow-md" : "border-stone-200 hover:border-stone-400"}`}>
          <div className="aspect-[16/9] overflow-hidden">
            <svg viewBox="0 0 1080 608" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
              <Art design={{ ...d, style: s.id, ...s.colors, master: true }} W={1080} H={1080} />
            </svg>
          </div>
          <div className="bg-white px-2.5 py-1.5">
            <div className="text-sm font-bold text-stone-800">{s.label}</div>
            <div className="text-[11px] leading-tight text-stone-500">{s.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Stili dei grandi maestri" aside={<Btn size="sm" onClick={() => update((x) => ({ ...x, design: { ...x.design, seed: Math.floor(Math.random() * 1e9) } }))}>🎲 Nuova variazione</Btn>}>
        {grid("maestri")}
        <label className="flex items-center gap-2 text-xs text-stone-600">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="accent-emerald-700" />
          Cambiando stile mantieni i miei colori
        </label>
      </Section>
      <Section title="Stili corporate">{grid("corporate")}</Section>

      <Section title="Simbolo principale">
        <div className="grid grid-cols-5 gap-2">
          {SYMBOLS.map((s) => (
            <button key={s.id} onClick={() => setSymbol(s.id)} title={`${s.label} — ${s.sub}`} aria-pressed={d.symbol === s.id}
              className={`rounded-xl border-2 p-1.5 transition ${d.symbol === s.id ? "border-emerald-700 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-400"}`}>
              <svg viewBox="-104 -104 208 208" className="w-full">
                <SymbolArt id={s.id} accent={d.accent} ink={d.text} paper={d.bg} />
              </svg>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">{SYMBOLS.find((s) => s.id === d.symbol)?.label} — {SYMBOLS.find((s) => s.id === d.symbol)?.sub}. Puoi aggiungerne altri dal tab Livelli.</p>
      </Section>

      <Section title="Formato di output">
        <div className="grid grid-cols-1 gap-2">
          {FORMATS.map((f) => (
            <button key={f.id} onClick={() => setFormat(f.id)} aria-pressed={d.format === f.id}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition ${d.format === f.id ? "border-emerald-700 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-400"}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                <div className="rounded-sm border-2 border-stone-500 bg-stone-100" style={{ width: 34 * Math.min(1, f.w / f.h), height: 34 * Math.min(1, f.h / f.w) }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-stone-800">{f.label} <span className="font-normal text-stone-500">· {f.sub}</span></div>
                <div className="truncate text-[11px] text-stone-500">{f.use}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">Cambiando formato i livelli standard si riposizionano; i tuoi elementi extra restano dove sono.</p>
      </Section>
    </div>
  );
}
