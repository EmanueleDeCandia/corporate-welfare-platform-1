import { useMemo, useState } from "react";
import { CertificateSVG } from "./CertificateSVG";
import { Btn, Chip, Modal, copyText, inputCls, toast } from "./ui";
import { FORMAT_BY_ID, STYLES, STYLE_BY_ID } from "@/lib/certificati-impatto/constants";
import { appLink, co2For, fmtDate, fmtNum, remixLink } from "@/lib/certificati-impatto/doc";
import { downloadBlob, exportRaster, fileName } from "@/lib/certificati-impatto/export";
import { EXAMPLES } from "@/lib/certificati-impatto/seeds";
import { linkFor } from "@/lib/certificati-impatto/share";
import type { Doc, SavedCert } from "@/lib/certificati-impatto/types";

interface Props {
  mine: SavedCert[];
  onEdit: (d: Doc) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const LEVELS = [
  { min: 0, name: "Esploratore", icon: "🧭" },
  { min: 1, name: "Seme", icon: "🌰" },
  { min: 3, name: "Germoglio", icon: "🌱" },
  { min: 6, name: "Pianta", icon: "🌿" },
  { min: 10, name: "Albero", icon: "🌳" },
];

export function Gallery({ mine, onEdit, onDelete, onCreate }: Props) {
  const [q, setQ] = useState("");
  const [style, setStyle] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "mine" | "examples">("all");
  const [sort, setSort] = useState<"recent" | "co2">("recent");
  const [open, setOpen] = useState<{ doc: Doc; example: boolean } | null>(null);

  const all = useMemo(
    () => [...mine.map((m) => ({ doc: m.doc, example: false })), ...EXAMPLES.map((d) => ({ doc: d, example: true }))],
    [mine]
  );
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all
      .filter((x) => (scope === "all" ? true : scope === "mine" ? !x.example : x.example))
      .filter((x) => style === "all" || x.doc.design.style === style)
      .filter((x) => !t || `${x.doc.user.first} ${x.doc.user.last} ${x.doc.user.company} ${x.doc.loc.city}`.toLowerCase().includes(t))
      .sort((a, b) => (sort === "recent" ? b.doc.createdAt - a.doc.createdAt : co2For(b.doc.loc.km) - co2For(a.doc.loc.km)));
  }, [all, q, style, scope, sort]);

  const totals = useMemo(() => {
    const km = all.reduce((s, x) => s + x.doc.loc.km, 0);
    return { n: all.length, km, co2: all.reduce((s, x) => s + co2For(x.doc.loc.km), 0), companies: new Set(all.map((x) => x.doc.user.company)).size };
  }, [all]);

  const board = useMemo(() => {
    const m = new Map<string, { n: number; co2: number }>();
    all.forEach((x) => {
      const e = m.get(x.doc.user.company) ?? { n: 0, co2: 0 };
      e.n++;
      e.co2 += co2For(x.doc.loc.km);
      m.set(x.doc.user.company, e);
    });
    return [...m.entries()].sort((a, b) => b[1].co2 - a[1].co2).slice(0, 5);
  }, [all]);

  const myCo2 = mine.reduce((s, m) => s + co2For(m.doc.loc.km), 0);
  const lvlIdx = LEVELS.reduce((acc, l, i) => (mine.length >= l.min ? i : acc), 0);
  const lvl = LEVELS[lvlIdx], next = LEVELS[lvlIdx + 1];
  const goal = 500;
  const pct = Math.min(100, (totals.co2 / goal) * 100);

  const invite = async () => {
    const url = appLink("invito");
    const text = "Crea il tuo Certificato di Impatto Km 0: personalizzalo con lo stile di un grande maestro e condividilo con i colleghi.";
    if (navigator.share) {
      try { await navigator.share({ title: "Certificato di Impatto Km 0", text, url }); return; } catch { /* annullato */ }
    }
    await copyText(`${text} ${url}`);
  };

  const download = async (d: Doc) => {
    try {
      downloadBlob(await exportRaster(d, "png"), fileName(d, "png"));
    } catch (e) { toast("Errore export: " + (e as Error).message, "err"); }
  };

  return (
    <div id="galleria" className="space-y-8">
      {/* contatori */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [String(totals.n), "certificati in galleria"],
          [fmtNum(totals.co2) + " kg", "CO2 evitata (stima)"],
          [String(totals.km), "km di filiera corta"],
          [String(totals.companies), "aziende CSR"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
            <div className="text-2xl font-bold tabular-nums text-emerald-900">{v}</div>
            <div className="text-xs text-stone-500">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-emerald-950 p-5 text-emerald-50 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Obiettivo della community</div>
              <div className="mt-1 text-lg font-bold">{fmtNum(totals.co2, 0)} / {goal} kg CO2 evitata (stima)</div>
            </div>
            <Btn variant="soft" onClick={invite}>🚀 Invita un collega</Btn>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-emerald-900"><div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: pct + "%" }} /></div>
          <p className="mt-2 text-xs text-emerald-200/80">Ogni certificato pubblicato avvicina l'obiettivo. Dati dimostrativi più i certificati creati su questo dispositivo.</p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-900/60 p-3">
            <div className="text-3xl">{lvl.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Il tuo livello: {lvl.name}</div>
              <div className="text-xs text-emerald-200/80">{mine.length} certificati · {fmtNum(myCo2)} kg{next ? ` · ancora ${next.min - mine.length} per diventare ${next.name} ${next.icon}` : " · livello massimo!"}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-2 text-sm font-bold text-stone-800">🏅 Classifica aziende CSR</div>
          <ol className="space-y-1.5">
            {board.map(([name, v], i) => (
              <li key={name} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center font-bold text-stone-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-stone-800">{name}</span>
                <span className="text-xs tabular-nums text-stone-500">{v.n} · {fmtNum(v.co2)} kg</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* filtri */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input className={inputCls + " max-w-xs"} placeholder="Cerca nome, azienda, comune…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cerca" />
          <div className="flex gap-1.5">
            {([["all", "Tutti"], ["mine", `Miei (${mine.length})`], ["examples", "Esempi"]] as const).map(([k, l]) => <Chip key={k} active={scope === k} onClick={() => setScope(k)}>{l}</Chip>)}
          </div>
          <select className={inputCls + " !w-auto"} value={sort} onChange={(e) => setSort(e.target.value as "recent" | "co2")} aria-label="Ordina">
            <option value="recent">Più recenti</option><option value="co2">Più CO2 evitata</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={style === "all"} onClick={() => setStyle("all")}>Tutti gli stili</Chip>
          {STYLES.map((s) => <Chip key={s.id} active={style === s.id} onClick={() => setStyle(s.id)}>{s.label}</Chip>)}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center">
          <p className="text-stone-600">{scope === "mine" ? "Non hai ancora pubblicato certificati." : "Nessun certificato corrisponde ai filtri."}</p>
          <Btn variant="primary" className="mt-4" onClick={onCreate}>Crea il tuo primo certificato</Btn>
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
          {list.map(({ doc, example }) => {
            const fm = FORMAT_BY_ID[doc.design.format];
            return (
              <article key={doc.id} className="group mb-5 break-inside-avoid overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                <button className="block w-full" onClick={() => setOpen({ doc, example })} aria-label={`Apri il certificato di ${doc.user.first} ${doc.user.last}`}>
                  <div style={{ aspectRatio: `${fm.w} / ${fm.h}` }}><CertificateSVG doc={doc} /></div>
                </button>
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-stone-800">{doc.user.first} {doc.user.last}</div>
                    <div className="truncate text-xs text-stone-500">{doc.user.company} · {doc.loc.city}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold tabular-nums text-emerald-800">{fmtNum(co2For(doc.loc.km))} kg</div>
                    <div className="text-[10px] text-stone-400">{example ? "esempio" : "tuo"} · {STYLE_BY_ID[doc.design.style].label}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} wide>
        {open && (
          <div className="grid gap-0 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,1fr)]">
            <div className="flex items-center justify-center bg-stone-200 p-4">
              <div className="w-full" style={{ maxWidth: open.doc.design.format === "story" ? 340 : 640 }}>
                <div style={{ aspectRatio: `${FORMAT_BY_ID[open.doc.design.format].w} / ${FORMAT_BY_ID[open.doc.design.format].h}` }} className="shadow-2xl">
                  <CertificateSVG doc={open.doc} />
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">{open.doc.user.first} {open.doc.user.last}</h3>
                  <p className="text-sm text-stone-500">{open.doc.user.company}</p>
                </div>
                <button onClick={() => setOpen(null)} className="rounded-full p-1 text-stone-400 hover:bg-stone-100" aria-label="Chiudi">✕</button>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ["ID", open.doc.id], ["Data", fmtDate(open.doc.createdAt)], ["Località", open.doc.loc.city], ["Distanza", `${open.doc.loc.km} km`],
                  ["CO2 evitata (stima)", `${fmtNum(co2For(open.doc.loc.km))} kg`], ["Stile", STYLE_BY_ID[open.doc.design.style].label],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-[11px] uppercase text-stone-400">{k}</dt><dd className="font-semibold text-stone-800">{v}</dd></div>
                ))}
              </dl>
              {open.example && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">Certificato dimostrativo con dati fittizi.</p>}
              <div className="grid grid-cols-2 gap-2">
                <Btn variant="primary" onClick={() => { const d = open.doc; setOpen(null); onEdit(open.example ? { ...d, id: "IMP-" + Math.random().toString(36).slice(2, 8).toUpperCase(), createdAt: Date.now() } : d); }}>
                  {open.example ? "✨ Remixa questo" : "✎ Modifica"}
                </Btn>
                <Btn onClick={() => download(open.doc)}>⬇ PNG</Btn>
                <Btn onClick={() => copyText(linkFor(open.doc, "direct"))}>🔗 Link verifica</Btn>
                <Btn onClick={() => copyText(remixLink(open.doc))}>⧉ Link remix</Btn>
                <Btn onClick={() => window.open(linkFor(open.doc, "direct"), "_blank")}>↗ Pagina pubblica</Btn>
                {!open.example && <Btn variant="danger" onClick={() => { if (confirm("Eliminare questo certificato dalla galleria?")) { onDelete(open.doc.id); setOpen(null); } }}>🗑 Elimina</Btn>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
