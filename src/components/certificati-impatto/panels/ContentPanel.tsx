import { CITIES, COMPANIES, CO2_PER_KM, KM_MAX, KM_MIN, STYLES } from "@/lib/certificati-impatto/constants";
import { applyStyle, co2For, fmtNum } from "@/lib/certificati-impatto/doc";
import type { Doc } from "@/lib/certificati-impatto/types";
import { Btn, Field, Section, inputCls } from "../ui";
import { PRESETS } from "@/lib/certificati-impatto/constants";

export interface PanelProps {
  doc: Doc;
  update: (fn: (d: Doc) => Doc, key?: string) => void;
}

const FIRST = ["Marco", "Giulia", "Luca", "Sara", "Paolo", "Elena", "Davide", "Chiara"];
const LAST = ["Rossi", "Bianchi", "Ferretti", "Conti", "Neri", "Marchetti", "Galli", "Serra"];

export function ContentPanel({ doc, update }: PanelProps) {
  const setUser = (k: keyof Doc["user"], v: string) => update((d) => ({ ...d, user: { ...d.user, [k]: v } }), "user-" + k);
  const setPartner = (k: keyof Doc["partners"], v: string) => update((d) => ({ ...d, partners: { ...d.partners, [k]: v } }), "pa-" + k);
  const setKm = (km: number) => update((d) => ({ ...d, loc: { ...d.loc, km: Math.min(KM_MAX, Math.max(KM_MIN, km)) } }), "km");

  const surprise = () =>
    update((d) => {
      const st = STYLES[Math.floor(Math.random() * STYLES.length)];
      let nd = applyStyle(d, st.id);
      if (Math.random() < 0.3) {
        const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
        nd = { ...nd, design: { ...nd.design, bg: p.bg, text: p.text, accent: p.accent, master: false } };
      }
      return { ...nd, design: { ...nd.design, seed: Math.floor(Math.random() * 1e9) } };
    });

  return (
    <div className="space-y-4">
      <Section title="Chi riceve il certificato">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><input className={inputCls} value={doc.user.first} onChange={(e) => setUser("first", e.target.value)} placeholder="Marco" /></Field>
          <Field label="Cognome"><input className={inputCls} value={doc.user.last} onChange={(e) => setUser("last", e.target.value)} placeholder="Rossi" /></Field>
        </div>
        <Field label="Azienda CSR di appartenenza">
          <input className={inputCls} list="csr-companies" value={doc.user.company} onChange={(e) => setUser("company", e.target.value)} placeholder="Loccioni Group" />
          <datalist id="csr-companies">{COMPANIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => { setUser("first", FIRST[Math.floor(Math.random() * FIRST.length)]); setUser("last", LAST[Math.floor(Math.random() * LAST.length)]); }}>🎲 Nome a caso</Btn>
          <Btn size="sm" variant="soft" onClick={surprise}>✨ Sorprendimi (stile + palette)</Btn>
        </div>
      </Section>

      <Section title="Territorio e impatto">
        <Field label="Comune / Località Marche">
          <select className={inputCls} value={doc.loc.city} onChange={(e) => update((d) => ({ ...d, loc: { ...d.loc, city: e.target.value } }), "city")}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Distanza filtro Km 0" hint={`${KM_MIN}–${KM_MAX} km`}>
          <input type="range" min={KM_MIN} max={KM_MAX} step={1} value={doc.loc.km} onChange={(e) => setKm(+e.target.value)} className="w-full accent-emerald-700" aria-label="Distanza in km" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[40, 45, 50, 55, 60, 65, 70].map((k) => (
              <button key={k} onClick={() => setKm(k)} className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${doc.loc.km === k ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"}`}>{k} km</button>
            ))}
          </div>
        </Field>
        <div className="rounded-xl bg-emerald-950 p-4 text-emerald-50">
          <div className="text-xs uppercase tracking-widest text-emerald-300">CO2 evitata · stima</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{fmtNum(co2For(doc.loc.km))} <span className="text-base font-medium text-emerald-300">kg</span></div>
          <div className="mt-1 text-xs text-emerald-200/80">{doc.loc.km} km × {fmtNum(CO2_PER_KM, 2)} kg CO2/km · rispetto a consegne singole dedicate</div>
        </div>
      </Section>

      <details className="rounded-xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold text-stone-800">Partner, DDT e tracciabilità</summary>
        <div className="mt-3 space-y-3">
          <Field label="Promotore"><input className={inputCls} value={doc.partners.promoter} onChange={(e) => setPartner("promoter", e.target.value)} /></Field>
          <Field label="Flotta logistica"><input className={inputCls} value={doc.partners.fleet} onChange={(e) => setPartner("fleet", e.target.value)} /></Field>
          <Field label="Startup partner"><input className={inputCls} value={doc.partners.startup} onChange={(e) => setPartner("startup", e.target.value)} /></Field>
          <Field label="N. DDT / Registro Magazzino" hint="compare nel disclaimer">
            <input className={inputCls} value={doc.ddt} onChange={(e) => update((d) => ({ ...d, ddt: e.target.value }), "ddt")} placeholder="es. 2026/0451" />
          </Field>
        </div>
      </details>
    </div>
  );
}
