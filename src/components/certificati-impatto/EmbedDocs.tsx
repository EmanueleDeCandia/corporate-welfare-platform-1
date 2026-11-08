import { useEffect, useState } from "react";
import { Btn, Field, Section, copyText, inputCls } from "./ui";
import { baseUrl, createDoc } from "@/lib/certificati-impatto/doc";
import { apiPayload } from "@/lib/certificati-impatto/share";

interface Msg { t: string; type: string; payload: unknown }

export function EmbedDocs() {
  const [partner, setPartner] = useState("illiria");
  const [company, setCompany] = useState("");
  const [height, setHeight] = useState(900);
  const [origin, setOrigin] = useState("");
  const [log, setLog] = useState<Msg[]>([]);

  const qs = new URLSearchParams();
  if (partner) qs.set("partner", partner);
  if (company) qs.set("company", company);
  qs.set("theme", "custom");
  if (origin) qs.set("origin", origin);
  const src = `${baseUrl()}#/widget?${qs.toString()}`;

  const snippet = `<!-- Container sul sito ospite -->
<div id="welfare-card-widget-container" style="width:100%;max-width:1100px;margin:0 auto;">
  <iframe
    src="${src}"
    width="100%" height="${height}px"
    style="border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1);"
    loading="lazy" allow="clipboard-write; web-share"
    title="Generatore Certificati di Impatto Km 0">
  </iframe>
</div>
<script>
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'impatto-km0') return;
    // e.data.type: CARD_GENERATED | CARD_SHARED | CARD_DOWNLOADED
    console.log(e.data.type, e.data.payload);
  });
</script>`;

  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.data?.source !== "impatto-km0") return;
      setLog((l) => [{ t: new Date().toLocaleTimeString("it-IT"), type: e.data.type, payload: e.data.payload }, ...l].slice(0, 12));
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, []);

  const og = `<meta property="og:title" content="Certificato di Impatto Km 0 — {Nome} {Cognome}" />
<meta property="og:description" content="{Km} km di filiera corta, stima {CO2} kg CO2 evitata." />
<meta property="og:image" content="https://tuo-dominio.it/og/{ID}.png" />
<meta property="og:url" content="https://tuo-dominio.it/v/{ID}" />
<meta name="twitter:card" content="summary_large_image" />`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Embed & API</h1>
        <p className="mt-1 max-w-3xl text-stone-600">
          L'editor è un microservizio statico: incorporalo via <code>&lt;iframe&gt;</code> in portali welfare e intranet. Quando l'utente genera, scarica o condivide,
          il widget invia eventi <code>postMessage</code> alla pagina ospite. Il widget qui sotto è reale: prova a creare e scaricare un certificato e guarda il log eventi.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-5">
          <Section title="Configura lo snippet">
            <div className="grid grid-cols-2 gap-3">
              <Field label="partner"><input className={inputCls} value={partner} onChange={(e) => setPartner(e.target.value)} /></Field>
              <Field label="company (precompila)"><input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Brembo" /></Field>
              <Field label="origin del sito ospite" hint="consigliato"><input className={inputCls} value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="https://portale.azienda.it" /></Field>
              <Field label="altezza (px)"><input type="number" className={inputCls} value={height} onChange={(e) => setHeight(+e.target.value)} /></Field>
            </div>
            <pre className="max-h-72 overflow-auto rounded-xl bg-stone-900 p-4 text-[11px] leading-relaxed text-emerald-200">{snippet}</pre>
            <Btn variant="primary" onClick={() => copyText(snippet)}>Copia snippet</Btn>
            <p className="text-xs text-stone-500">Parametri URL supportati: <code>partner</code>, <code>company</code>, <code>first</code>, <code>last</code>, <code>origin</code> (targetOrigin dei messaggi: impostalo sempre in produzione), <code>theme</code>.</p>
          </Section>
          <Section title="Log eventi dalla finestra figlia">
            {log.length === 0 && <p className="text-sm text-stone-500">Nessun evento ancora. Pubblica, scarica o condividi nel widget.</p>}
            <ul className="space-y-1.5">
              {log.map((m, i) => (
                <li key={i} className="rounded-lg bg-stone-50 p-2 text-xs">
                  <span className="mr-2 rounded bg-emerald-700 px-1.5 py-0.5 font-bold text-white">{m.type}</span><span className="text-stone-400">{m.t}</span>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all text-[10px] text-stone-600">{JSON.stringify(m.payload, (k, v) => (k === "image_data_url" && typeof v === "string" ? v.slice(0, 40) + "…(" + v.length + " car.)" : v), 1)}</pre>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Schema payload (WelfareKm0CardInputV5)">
            <pre className="max-h-64 overflow-auto rounded-xl bg-stone-900 p-4 text-[11px] leading-relaxed text-emerald-200">{JSON.stringify(apiPayload(createDoc(), ["LINKEDIN", "WHATSAPP"]), null, 2)}</pre>
          </Section>
          <Section title="OpenGraph per pagina di verifica">
            <p className="text-xs text-stone-600">Il sito aggiorna i meta-tag lato client, ma i crawler social non eseguono JavaScript: per anteprime ricche per ogni certificato serve una funzione edge/prerender che serva questi tag.</p>
            <pre className="overflow-auto rounded-xl bg-stone-900 p-4 text-[11px] text-emerald-200">{og}</pre>
          </Section>
        </div>
        <div className="xl:sticky xl:top-16 xl:self-start">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Anteprima live del widget</div>
          <iframe key={src} src={src} title="Anteprima widget" className="w-full rounded-xl border-0 bg-white shadow-xl" style={{ height: Math.min(height, 900) }} loading="lazy" />
        </div>
      </div>
    </div>
  );
}
