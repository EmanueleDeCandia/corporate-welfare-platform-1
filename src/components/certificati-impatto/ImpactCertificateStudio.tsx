"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CertificateSVG } from "./CertificateSVG";
import { Editor } from "./Editor";
import { Gallery } from "./Gallery";
import { Toaster, Btn, toast } from "./ui";
import { VerifyPage } from "./VerifyPage";
import { certId, createDoc, decodeCompact, decodeFull } from "@/lib/certificati-impatto/doc";
import { postToParent, readEmbedConfig } from "@/lib/certificati-impatto/embed";
import { clearDraft, loadCerts, loadDraft, saveCerts } from "@/lib/certificati-impatto/storage";
import type { Doc, SavedCert } from "@/lib/certificati-impatto/types";
import { Award, Palette, Plus, ArrowLeft } from "lucide-react";

export type ImpactStudioContext = {
  first?: string;
  last?: string;
  company?: string;
  promoter?: string;
  role?: string;
  city?: string;
  distanceKm?: number;
};

interface ImpactCertificateStudioProps {
  initialContext?: ImpactStudioContext;
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function ImpactCertificateStudio({
  initialContext,
  showBackLink = false,
  backHref = "/account",
  backLabel = "Torna all'area personale",
}: ImpactCertificateStudioProps) {
  const [mounted, setMounted] = useState(false);
  const [embed] = useState(readEmbedConfig);
  const [view, setView] = useState<"crea" | "gallery" | "verify">("crea");
  const [verifyArg, setVerifyArg] = useState<string>("");
  const [certs, setCerts] = useState<SavedCert[]>([]);
  const [editor, setEditor] = useState<{ doc: Doc; key: number } | null>(null);

  const defaultFirst = initialContext?.first || embed.first || undefined;
  const defaultLast = initialContext?.last || embed.last || undefined;
  const defaultCompany = initialContext?.company || embed.company || undefined;
  const defaultPromoter =
    initialContext?.promoter ||
    (embed.partner
      ? embed.partner.toLowerCase() === "illiria"
        ? "Gruppo Illiria"
        : embed.partner
      : "RADICI · Welfare & Territorio Marche");

  const newDoc = useCallback((): Doc => {
    const doc = createDoc({
      company: defaultCompany,
      first: defaultFirst,
      last: defaultLast,
      promoter: defaultPromoter,
    });
    if (initialContext?.city) {
      doc.loc.city = initialContext.city;
    }
    if (initialContext?.distanceKm) {
      doc.loc.km = initialContext.distanceKm;
    }
    return doc;
  }, [defaultCompany, defaultFirst, defaultLast, defaultPromoter, initialContext]);

  useEffect(() => {
    setMounted(true);
    setCerts(loadCerts());
  }, []);

  useEffect(() => {
    if (embed.embed) postToParent(embed, "WIDGET_READY", { version: 5 });
  }, [embed]);

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h.startsWith("/r/")) {
        const code = h.slice(3);
        const d = decodeFull(code);
        if (d) {
          setEditor({ doc: { ...d, id: certId(), createdAt: Date.now() }, key: Date.now() });
          setView("crea");
          toast("Design aperto in modalità remix: personalizzalo!");
        }
      } else if (h.startsWith("/v/")) {
        const code = h.slice(3);
        setVerifyArg(code);
        setView("verify");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (!editor && !window.location.hash.startsWith("#/v/") && !window.location.hash.startsWith("#/r/")) {
      const draft = loadDraft();
      setEditor({ doc: draft ?? newDoc(), key: 1 });
    }
  }, [editor, newDoc]);

  const openEditor = (d: Doc) => {
    setEditor((e) => ({ doc: d, key: (e?.key ?? 0) + 1 }));
    setView("crea");
  };

  const startNew = () => {
    clearDraft();
    setEditor((e) => ({ doc: newDoc(), key: (e?.key ?? 0) + 1 }));
    setView("crea");
  };

  const upsert = useCallback((d: Doc) => {
    setCerts((cs) => {
      const next = [{ doc: d }, ...cs.filter((c) => c.doc.id !== d.id)];
      if (!saveCerts(next)) toast("Spazio locale quasi pieno: rimuovi immagini o certificati vecchi.", "warn");
      return next;
    });
  }, []);

  const remove = (id: string) => {
    setCerts((cs) => {
      const n = cs.filter((c) => c.doc.id !== id);
      saveCerts(n);
      return n;
    });
  };

  const verified = useMemo(() => (view === "verify" && verifyArg ? decodeCompact(verifyArg) : null), [view, verifyArg]);

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col gap-4 rounded-3xl bg-forest p-6 text-cream sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sand">
            <Award size={14} className="text-gold" /> Certificati d&apos;Impatto Km 0
          </div>
          <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl text-white">
            Studio di Certificazione d&apos;Autore
          </h2>
          <p className="mt-1 text-sm text-sand/80 max-w-2xl">
            Genera, personalizza e firma i tuoi Certificati di Impatto a filiera corta (L. 61/2022) con stili artistici d&apos;ispirazione (Picasso, Monet, Cézanne) ed esporta in PDF A4, SVG o Carosello Social.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showBackLink && (
            <a
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-sand/30 bg-forest/40 px-3.5 py-2 text-xs font-medium text-sand hover:bg-forest/80 transition"
            >
              <ArrowLeft size={14} /> {backLabel}
            </a>
          )}
          <button
            onClick={() => setView("crea")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              view === "crea"
                ? "bg-sand text-forest shadow"
                : "border border-sand/30 bg-forest/40 text-sand hover:bg-forest/70"
            }`}
          >
            <Palette size={14} /> Editor Studio
          </button>
          <button
            onClick={() => setView("gallery")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              view === "gallery"
                ? "bg-sand text-forest shadow"
                : "border border-sand/30 bg-forest/40 text-sand hover:bg-forest/70"
            }`}
          >
            I miei Certificati {mounted ? `(${certs.length})` : ""}
          </button>
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-4 py-2 text-xs font-bold text-white shadow hover:opacity-95 transition"
          >
            <Plus size={14} /> Nuovo Certificato
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {view === "crea" && editor && (
        <div className="rounded-3xl bg-white p-4 md:p-6 shadow-sm border border-forest/10">
          <Editor
            key={editor.key}
            initial={editor.doc}
            inGallery={certs.some((c) => c.doc.id === editor.doc.id)}
            embed={embed}
            onSave={upsert}
            onNew={startNew}
          />
        </div>
      )}

      {view === "gallery" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-forest/10 space-y-6">
          <div className="flex items-center justify-between border-b border-forest/10 pb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-forest">Archivio Certificati Generati</h3>
              <p className="text-sm text-olive">Sfoglia, modifica o esporta i tuoi certificati salvati in locale.</p>
            </div>
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-xs font-bold text-cream hover:bg-forest/90 transition"
            >
              <Plus size={14} /> Crea Nuovo
            </button>
          </div>
          <Gallery mine={certs} onEdit={openEditor} onDelete={remove} onCreate={startNew} />
        </div>
      )}

      {view === "verify" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-forest/10">
          {verified ? (
            <VerifyPage
              doc={verified.doc}
              valid={verified.valid}
              owned={certs.some((c) => c.doc.id === verified.doc.id)}
              onCreate={startNew}
              onAdd={upsert}
            />
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <div className="text-4xl">❌</div>
              <h1 className="mt-2 text-xl font-bold text-rose-900">Link di verifica non valido</h1>
              <p className="mt-1 text-sm text-rose-800">Il codice di verifica o l&apos;impronta non corrispondono.</p>
              <Btn variant="primary" className="mt-4" onClick={startNew}>
                Crea un nuovo certificato
              </Btn>
            </div>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
}
