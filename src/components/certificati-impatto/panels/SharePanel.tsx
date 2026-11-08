import { useRef, useState } from "react";
import { CAPTION_TEMPLATES, HASHTAGS, PLACEHOLDERS } from "@/lib/certificati-impatto/constants";
import { findViolations } from "@/lib/certificati-impatto/doc";
import { downloadBlob, exportRaster, fileName, nativeShare } from "@/lib/certificati-impatto/export";
import { apiPayload, blueprint, captionFor, intentUrl, linkFor, type Channel } from "@/lib/certificati-impatto/share";
import { loadBackend, saveBackend } from "@/lib/certificati-impatto/storage";
import { Btn, Chip, Field, Section, copyText, inputCls, toast } from "../ui";
import { Share2, MessageCircle, Send, Copy, AlertTriangle } from "lucide-react";
import type { PanelProps } from "./ContentPanel";

export interface Actions {
  guard: () => boolean;
  onShared: (channel: string, link: string) => void;
  onDownloaded: (kind: string, name: string) => void;
}

const EMOJI = ["🌱", "🚚", "💚", "🌍", "🤝", "🏆", "👇", "✨", "🌾", "📍"];

export function SharePanel({ doc, update, actions }: PanelProps & { actions: Actions }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"LINKEDIN" | "INSTAGRAM" | "WHATSAPP">("LINKEDIN");
  const [backend, setBackend] = useState(loadBackend());
  const [sending, setSending] = useState(false);
  const cap = doc.caption;

  const setText = (text: string, template = cap.template) => update((d) => ({ ...d, caption: { template, text } }), "cap");
  const loadTemplate = (k: "linkedin" | "instagram" | "whatsapp") => update((d) => ({ ...d, caption: { template: k, text: CAPTION_TEMPLATES[k].text } }));
  const insert = (s: string) => {
    const el = ta.current;
    if (!el) return setText(cap.text + s, "custom");
    const a = el.selectionStart, b = el.selectionEnd;
    const t = cap.text.slice(0, a) + s + cap.text.slice(b);
    setText(t, "custom");
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + s.length, a + s.length); });
  };
  const wrapBold = () => {
    const el = ta.current;
    if (!el) return;
    const a = el.selectionStart, b = el.selectionEnd;
    if (a === b) return toast("Seleziona prima il testo da rendere grassetto", "warn");
    setText(cap.text.slice(0, a) + "**" + cap.text.slice(a, b) + "**" + cap.text.slice(b), "custom");
  };

  const limit = cap.template === "custom" ? 3000 : CAPTION_TEMPLATES[cap.template].limit;
  const allViolations = findViolations(doc);
  const violations = allViolations.filter((v) => v.where === "Caption social");
  const isBlocked = allViolations.length > 0;
  const previewChannel: Channel = tab;
  const preview = captionFor(doc, previewChannel);

  const shareTo = async (c: Channel) => {
    if (!actions.guard()) return;
    const link = linkFor(doc, c);
    const caption = captionFor(doc, c);
    if (c === "INSTAGRAM") {
      const blob = await exportRaster(doc, "png", 1);
      const name = fileName(doc, "png", "instagram");
      downloadBlob(blob, name);
      actions.onDownloaded("PNG", name);
      await copyText(caption);
      toast("Immagine scaricata e caption copiata: apri Instagram, crea un post e incolla.", "ok");
      actions.onShared(c, link);
      return;
    }
    const url = intentUrl(doc, c);
    if (c === "LINKEDIN" || c === "FACEBOOK") await copyText(caption);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      actions.onShared(c, link);
      if (c === "LINKEDIN") toast("Caption copiata: incollala nel post LinkedIn e allega la PNG scaricata.", "ok");
    }
  };

  const native = async () => {
    if (!actions.guard()) return;
    const r = await nativeShare(doc, captionFor(doc, "WHATSAPP"), linkFor(doc, "WHATSAPP"));
    if (r === "shared") actions.onShared("NATIVE", linkFor(doc, "WHATSAPP"));
    else if (r === "unsupported") toast("Condivisione nativa non disponibile su questo dispositivo: usa i pulsanti dei canali.", "warn");
  };

  const send = async () => {
    if (!backend) return toast("Inserisci l'URL del tuo endpoint backend", "warn");
    if (!actions.guard()) return;
    setSending(true);
    saveBackend(backend);
    try {
      const res = await fetch(backend, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(apiPayload(doc, ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "WHATSAPP"])) });
      toast(`Backend: ${res.status} ${res.statusText}`, res.ok ? "ok" : "err");
    } catch (e) {
      toast("Invio fallito: " + (e as Error).message, "err");
    } finally {
      setSending(false);
    }
  };

  const bp = blueprint(doc, tab as "LINKEDIN" | "INSTAGRAM" | "WHATSAPP");

  return (
    <div className="space-y-4">
      <Section title="Condividi ora">
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="primary" disabled={isBlocked} onClick={native} className="col-span-2"><Share2 size={14} className="mr-1 inline" /> Condividi con immagine (smartphone)</Btn>
          <Btn disabled={isBlocked} onClick={() => shareTo("LINKEDIN")}>in LinkedIn</Btn>
          <Btn disabled={isBlocked} onClick={() => shareTo("WHATSAPP")}><MessageCircle size={14} className="mr-1 inline" /> WhatsApp</Btn>
          <Btn disabled={isBlocked} onClick={() => shareTo("FACEBOOK")}>f Facebook</Btn>
          <Btn onClick={() => shareTo("INSTAGRAM")}>◎ Instagram</Btn>
          <Btn disabled={isBlocked} onClick={() => shareTo("X")}>𝕏 X / Twitter</Btn>
          <Btn disabled={isBlocked} onClick={() => shareTo("EMAIL")}>✉ Email</Btn>
        </div>
        <p className="text-xs text-stone-500">
          Per policy delle piattaforme Instagram non accetta post da link web: scarichiamo l'immagine e copiamo la caption. LinkedIn e Facebook aprono la finestra di condivisione con il link tracciato (anteprima OpenGraph).
        </p>
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => copyText(linkFor(doc, "direct"))}><Copy size={14} className="mr-1 inline" /> Copia link di verifica</Btn>
          <Btn size="sm" onClick={() => window.open(linkFor(doc, "direct"), "_blank")}>Apri pagina</Btn>
        </div>
      </Section>

      <Section title="Editor caption guidato" aside={<span className={`text-xs tabular-nums ${cap.text.length > limit ? "font-bold text-rose-600" : "text-stone-400"}`}>{cap.text.length}/{limit}</span>}>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CAPTION_TEMPLATES) as ("linkedin" | "instagram" | "whatsapp")[]).map((k) => (
            <Chip key={k} active={cap.template === k} onClick={() => { loadTemplate(k); setTab(k.toUpperCase() as "LINKEDIN"); }}>{CAPTION_TEMPLATES[k].label.split(" · ")[0]}</Chip>
          ))}
          <Chip active={cap.template === "custom"} onClick={() => setText(cap.text, "custom")}>Personalizzato</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1.5">
          <button onClick={wrapBold} className="rounded px-2 py-1 text-sm font-black hover:bg-white" title="Grassetto (Unicode)">B</button>
          <button onClick={() => insert(" " + HASHTAGS)} className="rounded px-2 py-1 text-xs font-semibold hover:bg-white">#hashtag progetto</button>
          {EMOJI.map((e) => <button key={e} onClick={() => insert(e)} className="rounded px-1 py-0.5 text-base hover:bg-white">{e}</button>)}
        </div>
        <textarea ref={ta} value={cap.text} onChange={(e) => setText(e.target.value, "custom")} rows={9} className={inputCls + " font-sans leading-relaxed"} aria-label="Testo caption" />
        <div className="flex flex-wrap gap-1">
          {PLACEHOLDERS.map((p) => <button key={p} onClick={() => insert(p)} className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-800 hover:bg-emerald-100">{p}</button>)}
        </div>
        <p className="text-[11px] text-stone-500">Usa <code>**testo**</code> per il grassetto: sui social diventa grassetto Unicode. <code>[Link Pagina Web]</code> viene sostituito col link UTM del canale scelto.</p>
        {violations.length > 0 && (
          <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800">
            ⚠ Termini vietati nella caption: {violations.map((v) => `«${v.term}»`).join(", ")}
          </div>
        )}
        <div>
          <div className="mb-1 flex gap-1.5">
            {(["LINKEDIN", "INSTAGRAM", "WHATSAPP"] as const).map((c) => <Chip key={c} active={tab === c} onClick={() => setTab(c)}>Anteprima {c === "LINKEDIN" ? "LinkedIn" : c === "INSTAGRAM" ? "IG/FB" : "WhatsApp"}</Chip>)}
          </div>
          <div className="whitespace-pre-wrap break-words rounded-xl border border-stone-200 bg-[#e7f5dc] p-3 text-[13px] leading-relaxed text-stone-800">{preview}</div>
        </div>
      </Section>

      <Section title="Tracciabilità · UTM">
        <div className="grid grid-cols-2 gap-3">
          <Field label="utm_campaign"><input className={inputCls} value={doc.utm.campaign} onChange={(e) => update((d) => ({ ...d, utm: { ...d.utm, campaign: e.target.value.replace(/\s+/g, "_") } }), "utm1")} /></Field>
          <Field label="utm_content"><input className={inputCls} value={doc.utm.content} onChange={(e) => update((d) => ({ ...d, utm: { ...d.utm, content: e.target.value.replace(/\s+/g, "_") } }), "utm2")} /></Field>
        </div>
        <p className="text-xs text-stone-500"><code>utm_source</code> e <code>utm_medium</code> sono automatici per canale (linkedin/social, qr/card, pdf/print…).</p>
        <div className="break-all rounded-lg bg-stone-100 p-2 font-mono text-[10px] text-stone-600">{linkFor(doc, tab).slice(0, 190)}…</div>
      </Section>

      <details className="rounded-xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold text-stone-800">Pubblicazione diretta via API (blueprint backend)</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-stone-600">
            Instagram Graph, Facebook Graph, LinkedIn e WhatsApp Cloud richiedono token OAuth e un server: non si possono chiamare in sicurezza da un frontend statico.
            Qui trovi le chiamate pronte da implementare nel tuo backend e un invio opzionale del payload al tuo endpoint.
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-stone-900 p-3 text-[10.5px] leading-snug text-emerald-200">{JSON.stringify(bp, null, 2)}</pre>
          <Field label="Endpoint backend (POST /api/share)">
            <input className={inputCls} value={backend} onChange={(e) => setBackend(e.target.value)} placeholder="https://tuo-server.it/api/share" />
          </Field>
          <div className="flex gap-2">
            <Btn size="sm" disabled={sending} onClick={send}>{sending ? "Invio…" : "Invia payload"}</Btn>
            <Btn size="sm" onClick={() => copyText(JSON.stringify(apiPayload(doc, ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "WHATSAPP"]), null, 2))}>Copia payload JSON</Btn>
          </div>
        </div>
      </details>
    </div>
  );
}
