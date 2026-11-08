import { useEffect, useState } from "react";
import { contrast, fixContrast, harmonies, hexToRgb, isHex, parseColor } from "@/lib/certificati-impatto/color";
import { PRESETS } from "@/lib/certificati-impatto/constants";
import { loadRecent, pushRecent } from "@/lib/certificati-impatto/storage";
import { Btn, Section, toast } from "../ui";
import type { PanelProps } from "./ContentPanel";

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const [hex, setHex] = useState(value);
  const [rgb, setRgb] = useState("");
  useEffect(() => {
    setHex(value);
    const [r, g, b] = hexToRgb(value);
    setRgb(`${r}, ${g}, ${b}`);
  }, [value]);
  const commit = (raw: string) => {
    const p = parseColor(raw);
    if (p) onChange(p);
  };
  const Eye = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
        {hint && <span className="text-[10px] text-stone-400">{hint}</span>}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={label} value={isHex(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-0.5" />
        <input value={hex} onChange={(e) => { setHex(e.target.value); if (/^#?[0-9a-fA-F]{6}$/.test(e.target.value.trim())) commit(e.target.value); }} onBlur={() => { commit(hex); setHex(value); }}
          className="w-24 rounded-lg border border-stone-300 px-2 py-2 font-mono text-sm uppercase focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25" aria-label={label + " HEX"} />
        <input value={rgb} onChange={(e) => setRgb(e.target.value)} onKeyDown={(e) => e.key === "Enter" && commit(rgb)} onBlur={() => { commit(rgb); const [r, g, b] = hexToRgb(value); setRgb(`${r}, ${g}, ${b}`); }}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-2 font-mono text-xs focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25" aria-label={label + " RGB"} placeholder="r, g, b" />
        {Eye && (
          <button title="Contagocce: preleva un colore dallo schermo" className="rounded-lg border border-stone-300 px-2 py-2 text-sm hover:bg-stone-50"
            onClick={async () => { try { const r = await new Eye().open(); onChange(r.sRGBHex.toUpperCase()); } catch { /* annullato */ } }}>💧</button>
        )}
      </div>
    </div>
  );
}

function Ratio({ label, a, b, min }: { label: string; a: string; b: string; min: number }) {
  const c = contrast(a, b);
  const ok = c >= min;
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
      <span>{label}</span>
      <span className="font-bold tabular-nums">{c.toFixed(1)}:1 {ok ? (c >= 7 ? "AAA ✓" : "AA ✓") : `✗ (min ${min}:1)`}</span>
    </div>
  );
}

export function ColorPanel({ doc, update }: PanelProps) {
  const d = doc.design;
  const [recent, setRecent] = useState<string[]>(loadRecent());
  const set = (k: "bg" | "text" | "accent", v: string) => {
    update((x) => ({ ...x, design: { ...x.design, [k]: v } }), "col-" + k);
  };
  const remember = (c: string) => setRecent(pushRecent(c));
  const h = harmonies(d.accent);

  return (
    <div className="space-y-4">
      <Section title="Tavolozza libera">
        <ColorField label="Sfondo (bg_color_hex)" value={d.bg} onChange={(v) => set("bg", v)} />
        <ColorField label="Testo (text_color_hex)" value={d.text} onChange={(v) => set("text", v)} />
        <ColorField label="Accento (accent_color_hex)" value={d.accent} onChange={(v) => set("accent", v)} hint="badge, cornici, CO2, icone" />
        <div className="flex flex-wrap gap-2">
          <Btn size="sm" onClick={() => update((x) => ({ ...x, design: { ...x.design, bg: x.design.text, text: x.design.bg } }))}>⇄ Inverti sfondo/testo</Btn>
          <Btn size="sm" onClick={() => { remember(d.bg); remember(d.text); remember(d.accent); toast("Colori salvati tra i recenti"); }}>★ Salva tra i recenti</Btn>
        </div>
        <label className="flex items-start gap-2 rounded-lg bg-stone-50 p-2.5 text-xs text-stone-600">
          <input type="checkbox" className="mt-0.5 accent-emerald-700" checked={!d.master} onChange={(e) => update((x) => ({ ...x, design: { ...x.design, master: !e.target.checked } }))} />
          <span><b>Applica i miei colori anche all'opera d'arte</b>: i toni del maestro vengono derivati dal colore di accento (armonie di tinta) invece della palette d'autore.</span>
        </label>
        {recent.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-stone-400">Recenti — clic = accento</div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((c) => <button key={c} title={c} onClick={() => set("accent", c)} className="h-6 w-6 rounded-full border border-stone-300" style={{ background: c }} />)}
            </div>
          </div>
        )}
      </Section>

      <Section title="Accessibilità (WCAG)">
        <Ratio label="Testo su sfondo" a={d.text} b={d.bg} min={4.5} />
        <Ratio label="Accento su sfondo (testo grande)" a={d.accent} b={d.bg} min={3} />
        <Btn size="sm" variant="soft" onClick={() => update((x) => ({ ...x, design: { ...x.design, text: fixContrast(x.design.text, x.design.bg, 7), accent: fixContrast(x.design.accent, x.design.bg, 3.2) } }))}>🪄 Correggi contrasto automaticamente</Btn>
      </Section>

      <Section title="Preset rapidi">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => update((x) => ({ ...x, design: { ...x.design, bg: p.bg, text: p.text, accent: p.accent, master: false } }))}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-2 text-left text-xs font-semibold text-stone-700 hover:border-stone-400">
              <span className="flex overflow-hidden rounded-md border border-stone-300">
                {[p.bg, p.text, p.accent].map((c, i) => <span key={i} className="h-6 w-4" style={{ background: c }} />)}
              </span>
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">I preset applicano i colori anche all'opera d'arte; ogni valore resta modificabile.</p>
      </Section>

      <Section title="Armonie dall'accento">
        {Object.entries(h).map(([name, cols]) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="w-24 text-xs text-stone-500">{name}</span>
            <div className="flex flex-1 overflow-hidden rounded-lg border border-stone-200">
              {cols.map((c, i) => <button key={i} title={`Usa ${c} come accento`} onClick={() => set("accent", c)} className="h-8 flex-1" style={{ background: c }} />)}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}
