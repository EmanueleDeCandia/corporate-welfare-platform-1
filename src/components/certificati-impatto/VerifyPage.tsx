import { useEffect } from "react";
import { CertificateSVG } from "./CertificateSVG";
import { Btn, copyText, toast } from "./ui";
import { Download, Copy, ExternalLink, Plus, Award, MessageCircle, AlertTriangle } from "lucide-react";
import { CO2_PER_KM, FORMAT_BY_ID, LEGAL_CO2, LEGAL_KM0, LEGAL_LOGISTICS, STYLE_BY_ID } from "@/lib/certificati-impatto/constants";
import { baseUrl, co2For, fmtDate, fmtNum } from "@/lib/certificati-impatto/doc";
import { downloadBlob, exportRaster, fileName } from "@/lib/certificati-impatto/export";
import { fingerprint } from "@/lib/certificati-impatto/doc";
import { intentUrl } from "@/lib/certificati-impatto/share";
import type { Doc } from "@/lib/certificati-impatto/types";

function setMeta(property: string, content: string, attr = "property") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function VerifyPage({ doc, valid, owned, onCreate, onAdd }: { doc: Doc; valid: boolean; owned: boolean; onCreate: () => void; onAdd: (d: Doc) => void }) {
  const fm = FORMAT_BY_ID[doc.design.format];
  const co2 = co2For(doc.loc.km);

  useEffect(() => {
    const prev = document.title;
    const title = `Attestato di Impatto di ${doc.user.first} ${doc.user.last} · ${doc.user.company}`;
    const desc = `${doc.loc.km} km di filiera corta da ${doc.loc.city}: stima di ${fmtNum(co2)} kg di CO2 equivalente evitata. Crea anche tu il tuo attestato.`;
    document.title = title;
    setMeta("og:title", title);
    setMeta("og:description", desc);
    if (typeof window !== "undefined") {
      setMeta("og:url", window.location.href);
    }
    setMeta("og:type", "article");
    setMeta("description", desc, "name");
    return () => { document.title = prev; };
  }, [doc, co2]);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex items-start justify-center">
        <div className="w-full shadow-2xl ring-1 ring-black/10" style={{ maxWidth: doc.design.format === "story" ? 360 : 720, aspectRatio: `${fm.w} / ${fm.h}` }}>
          <CertificateSVG doc={doc} />
        </div>
      </div>
      <div className="space-y-5">
        <div className={`flex items-center gap-3 rounded-2xl p-4 ${valid ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
          <div className="text-3xl">{valid ? "✅" : "⚠️"}</div>
          <div>
            <div className="font-bold">{valid ? "Link integro: i dati non risultano alterati" : "Impronta non corrispondente: il link potrebbe essere stato modificato"}</div>
            <div className="text-xs opacity-80">Impronta {fingerprint(doc)} · ID {doc.id} · emesso il {fmtDate(doc.createdAt)}</div>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">{doc.user.first} {doc.user.last}</h1>
          <p className="text-stone-600">{doc.user.company} · con {doc.partners.promoter}</p>
        </div>
        <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-sm">
          <div><dt className="text-[11px] uppercase text-stone-400">Località</dt><dd className="font-semibold">{doc.loc.city}</dd></div>
          <div><dt className="text-[11px] uppercase text-stone-400">Distanza</dt><dd className="font-semibold">{doc.loc.km} km</dd></div>
          <div className="col-span-2"><dt className="text-[11px] uppercase text-stone-400">Calcolo (stima)</dt>
            <dd className="font-semibold">{doc.loc.km} km × {fmtNum(CO2_PER_KM, 2)} kg CO2/km = <span className="text-emerald-800">{fmtNum(co2)} kg CO2 equivalente evitata</span></dd></div>
          <div><dt className="text-[11px] uppercase text-stone-400">Flotta</dt><dd className="font-semibold">{doc.partners.fleet}</dd></div>
          <div><dt className="text-[11px] uppercase text-stone-400">Stile</dt><dd className="font-semibold">{STYLE_BY_ID[doc.design.style].label}</dd></div>
        </dl>
        <ul className="space-y-1 text-xs text-stone-500">
          <li>• {LEGAL_KM0}</li><li>• {LEGAL_LOGISTICS}</li><li>• {LEGAL_CO2.replace("[DDT]", doc.ddt || "—")}</li>
          <li className="pt-1 italic">La verifica riguarda l'integrità dei dati contenuti nel link; non sostituisce DDT e Registro di Magazzino.</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" size="lg" onClick={onCreate}><Plus size={14} className="mr-1 inline" /> Crea il tuo attestato</Btn>
          {!owned && <Btn size="lg" onClick={() => { onAdd(doc); toast("Aggiunto alla tua galleria"); }}><Plus size={14} className="mr-1 inline" /> Aggiungi alla mia galleria</Btn>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={async () => downloadBlob(await exportRaster(doc, "png"), fileName(doc, "png"))}><Download size={13} className="mr-1 inline" /> PNG</Btn>
          <Btn onClick={() => typeof window !== "undefined" && copyText(window.location.href)}><Copy size={13} className="mr-1 inline" /> Copia link</Btn>
          <Btn onClick={() => window.open(intentUrl(doc, "LINKEDIN")!, "_blank")}>LinkedIn</Btn>
          <Btn onClick={() => window.open(intentUrl(doc, "WHATSAPP")!, "_blank")}>WhatsApp</Btn>
        </div>
        <p className="text-[11px] text-stone-400">{baseUrl()}</p>
      </div>
    </div>
  );
}
