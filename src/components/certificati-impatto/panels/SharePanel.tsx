import { useRef, useState, useEffect } from "react";
import { CAPTION_TEMPLATES, HASHTAGS, PLACEHOLDERS } from "@/lib/certificati-impatto/constants";
import { findViolations } from "@/lib/certificati-impatto/doc";
import { downloadBlob, exportRaster, fileName, nativeShare } from "@/lib/certificati-impatto/export";
import { apiPayload, blueprint, captionFor, intentUrl, linkFor, shortenDocUrl, type Channel } from "@/lib/certificati-impatto/share";
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
  const [shortUrl, setShortUrl] = useState<string>("");
  const cap = doc.caption;

  useEffect(() => {
    let active = true;
    shortenDocUrl(doc, "direct").then((url) => {
      if (active) setShortUrl(url);
    });
    return () => {
      active = false;
    };
  }, [doc]);

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
  const effectiveLink = shortUrl || linkFor(doc, previewChannel);
  const preview = captionFor(doc, previewChannel, true, effectiveLink);

  const shareTo = async (c: Channel) => {
    if (!actions.guard()) return;
    const link = await shortenDocUrl(doc, c.toLowerCase());
    const caption = captionFor(doc, c, true, link);
    if (c === "INSTAGRAM") {
      const blob = await exportRaster(doc, "png", 1);
      const name = fileName(doc, "png", "instagram");
      downloadBlob(blob, name);
      actions.onDownloaded("PNG", name);
      await copyText(caption);
      toast("Immagine scaricata e caption copiata con link compatto: apri Instagram, crea un post e incolla.", "ok");
      actions.onShared(c, link);
      return;
    }
    const url = intentUrl(doc, c, link);
    if (c === "LINKEDIN" || c === "FACEBOOK") await copyText(caption);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      actions.onShared(c, link);
      if (c === "LINKEDIN") toast("Caption copiata con link compatto: incollala nel post LinkedIn e allega la PNG scaricata.", "ok");
    }
  };

  const native = async () => {
    if (!actions.guard()) return;
    const link = await shortenDocUrl(doc, "whatsapp");
    const r = await nativeShare(doc, captionFor(doc, "WHATSAPP", true, link), link);
    if (r === "shared") actions.onShared("NATIVE", link);
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
          I link generati usano l'URL shortener interno protetto e compatto (es. <code className="text-forest font-mono">/c/{doc.id}</code>). I clic e le visualizzazioni vengono tracciati sul server garantendo il rispetto della privacy e l'attribuzione dell'invito.
        </p>
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => copyText(effectiveLink)}><Copy size={14} className="mr-1 inline" /> Copia link compatto</Btn>
          <Btn size="sm" onClick={() => window.open(effectiveLink, "_blank")}>Apri pagina</Btn>
        </div>
      </Section>

      <Section title="Editor caption guidato" aside={<span className={`text-xs tabular-nums ${cap.text.length > limit ? "font-bold text-rose-600" : "text-stone-400"}`}>{cap.text.length}/{limit}</span>}>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={cap.template === "linkedin"} onClick={() => loadTemplate("linkedin")}>LinkedIn</Chip>
          <Chip active={cap.template === "instagram"} onClick={() => loadTemplate("instagram")}>Instagram</Chip>
          <Chip active={cap.template === "whatsapp"} onClick={() => loadTemplate("whatsapp")}>WhatsApp</Chip>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-stone-400">Variabili:</span>
          {PLACEHOLDERS.map((p) => (
            <button key={p} type="button" onClick={() => insert(p)} className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-700 hover:bg-stone-200">
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-stone-400">Emoji:</span>
          {EMOJI.map((e) => (
            <button key={e} type="button" onClick={() => insert(e)} className="rounded p-1 hover:bg-stone-100">
              {e}
            </button>
          ))}
          <button type="button" onClick={wrapBold} className="ml-auto rounded border border-stone-200 px-2 py-0.5 text-xs font-bold text-stone-700 hover:bg-stone-50">
            **B** Grassetto
          </button>
        </div>
        <textarea
          ref={ta}
          rows={7}
          value={cap.text}
          onChange={(e) => setText(e.target.value, "custom")}
          className={inputCls + " font-mono text-xs leading-relaxed"}
          placeholder="Scrivi qui la caption personalizzata..."
        />
        {violations.length > 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            <AlertTriangle size={14} className="mr-1 inline text-amber-600" /> <strong>Attenzione:</strong> rimossi o riformulati i termini vietati in conformità al Codice del Consumo (D.Lgs. 30/2026):{" "}
            {violations.map((v) => `«${v.term}»`).join(", ")}
          </div>
        )}
      </Section>

      <Section title="Anteprima post per canale">
        <div className="flex gap-1 border-b border-stone-200 text-xs">
          {(["LINKEDIN", "INSTAGRAM", "WHATSAPP"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`border-b-2 px-3 py-1.5 font-semibold transition ${tab === k ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <pre className="max-h-48 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-800">
          {preview}
        </pre>
      </Section>

      <Section title="Blueprint API webhook esterne">
        <p className="text-xs text-stone-500">
          Schema per pubblicare programmaticamente tramite Meta Graph API e LinkedIn UGC API via un tuo microservizio autorizzato.
        </p>
        <pre className="max-h-56 overflow-auto rounded-lg bg-stone-900 p-3 text-[11px] font-mono leading-relaxed text-emerald-400">
          {JSON.stringify(bp, null, 2)}
        </pre>
        <Field label="Endpoint webhook partner (opzionale)">
          <input
            type="url"
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
            placeholder="https://api.tua-azienda.it/v1/certificati/publish"
            className={inputCls}
          />
        </Field>
        <div className="flex justify-end">
          <Btn disabled={sending || !backend || isBlocked} onClick={send}>
            <Send size={14} className="mr-1 inline" /> {sending ? "Invio in corso..." : "Invia payload al backend"}
          </Btn>
        </div>
      </Section>
    </div>
  );
}
