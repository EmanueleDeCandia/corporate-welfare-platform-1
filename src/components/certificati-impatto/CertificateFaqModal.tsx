"use client";

import { useState, useEffect } from "react";
import { X, HelpCircle, ShieldCheck, Share2, Link2, Sparkles, ChevronDown, ChevronRight, Server, Globe } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  summary: string;
  content: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "stringa-url",
    question: "Che cos'è la stringa alfanumerica presente nel link di verifica? Come opera in locale e in Cloud Run?",
    summary: "Architettura decentralizzata zero-database: l'attestato è compresso e firmato direttamente nell'URL.",
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-olive">
        <p>
          La stringa visibile nell&apos;URL (dopo <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-forest">#/v/...</code>) 
          è l&apos;intero certificato compresso e firmato digitalmente. Non è un codice provvisorio, ma il cuore dell&apos;architettura decentralizzata.
        </p>
        <div className="rounded-xl border border-forest/10 bg-paper p-3 space-y-2">
          <p className="font-semibold text-forest">Come viene generata:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li><strong>Compattazione:</strong> anagrafica, azienda CSR committente, comune, km di filiera corta, CO2 evitata, stile artistico e DDT vengono serializzati nello schema compatto.</li>
            <li><strong>Compressione LZ-String:</strong> la struttura viene compressa tramite l&apos;algoritmo LZ-String, ottimizzato per stringhe URI-safe.</li>
            <li><strong>Decodifica istantanea:</strong> chi apre il link o inquadra il QR decomprime in millisecondi i dati senza interrogare alcun database.</li>
          </ol>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 pt-1">
          <div className="rounded-xl border border-forest/15 bg-white p-3">
            <div className="flex items-center gap-1.5 font-bold text-forest mb-1">
              <Server size={14} className="text-gold" />
              <span>In Ambiente Locale</span>
            </div>
            <p className="text-[11px] text-olive/90">
              Decompressione e rendering avvengono interamente nel browser (client-side). I dati risiedono in <code className="font-mono">localStorage</code> e il link compresso permette di condividere il design tra schede e dispositivi senza scrivere su disco.
            </p>
          </div>
          <div className="rounded-xl border border-forest/15 bg-white p-3">
            <div className="flex items-center gap-1.5 font-bold text-forest mb-1">
              <Globe size={14} className="text-gold" />
              <span>In Cloud Run (Produzione)</span>
            </div>
            <p className="text-[11px] text-olive/90">
              L&apos;endpoint server intercetta la stringa ed esegue il prerender SSR dei metatag OpenGraph per i crawler social (LinkedIn, WhatsApp Preview). Garantisce scalabilità illimitata a costo zero anche su milioni di visualizzazioni virali.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "integrita-antimanomissione",
    question: "Come viene garantita l'integrità e l'autenticità contro le manomissioni?",
    summary: "Impronta crittografica di controllo (Fingerprint) che blocca qualsiasi alterazione dei dati.",
    content: (
      <div className="space-y-2.5 text-xs leading-relaxed text-olive">
        <p>
          Nel payload compresso è calcolato un hash crittografico basato sui campi essenziali del certificato:
        </p>
        <div className="rounded-xl bg-forest/5 p-2.5 font-mono text-[11px] text-forest border border-forest/10">
          Fingerprint = Hash(ID + Nome + Cognome + Azienda + Comune + Km)
        </div>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Verifica automatica:</strong> all&apos;apertura della pagina di verifica, il sistema ricalcola l&apos;impronta e la confronta con quella originale.</li>
          <li><strong>Protezione attiva:</strong> se un utente prova ad alterare manualmente i parametri nell&apos;URL (es. modificando il nome o gonfiando i km per sembrare più virtuoso), il controllo fallisce e la pagina espone: <span className="font-semibold text-wine">«Link di verifica non valido o manomesso»</span>.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "diffusione-social",
    question: "Come funzionano le opzioni di condivisione social?",
    summary: "Tre livelli operativi: Intent URL diretti, Web Share API nativa per smartphone e Blueprint B2B.",
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-olive">
        <p>La diffusione multicanale opera su tre livelli complementari:</p>
        <div className="space-y-2 pt-1">
          <div className="rounded-xl border border-forest/10 bg-white p-2.5">
            <strong className="block text-forest mb-0.5">1. Intent URL Diretti (Client-side)</strong>
            <span>Apre direttamente WhatsApp, LinkedIn, Facebook, X o Email precompilando caption, hashtag e link tracciato.</span>
          </div>
          <div className="rounded-xl border border-forest/10 bg-white p-2.5">
            <strong className="block text-forest mb-0.5">2. Web Share API (Smartphone)</strong>
            <span>Genera il file PNG binario in memoria e invoca il menu nativo di iOS/Android per pubblicare come immagine su Instagram Stories, Feed o chat.</span>
          </div>
          <div className="rounded-xl border border-forest/10 bg-white p-2.5">
            <strong className="block text-forest mb-0.5">3. Blueprint API (Automazione B2B)</strong>
            <span>Predisposizione dei payload JSON strutturati per inoltro a server aziendali dotati di token OAuth per post automatici d&apos;impresa.</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tracciabilita-utm",
    question: "In che modo viene tracciata la diffusione e l'engagement (UTM)?",
    summary: "Parametri standard UTM allegati automaticamente a ogni link condiviso.",
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-olive">
        <p>Ogni canale di pubblicazione allega parametri standard di tracciamento:</p>
        <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-forest/90">
          <li><strong>LinkedIn:</strong> utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign=impatto_km0</li>
          <li><strong>WhatsApp:</strong> utm_source=whatsapp&amp;utm_medium=social&amp;utm_campaign=impatto_km0</li>
          <li><strong>Link Diretto:</strong> utm_source=direct&amp;utm_medium=link</li>
          <li><strong>Invito Collega:</strong> utm_source=invito&amp;utm_medium=referral</li>
        </ul>
        <p className="pt-1 text-olive">
          Questo consente al circuito RADICI e all&apos;azienda CSR di misurare la viralità della campagna, i tassi di clic e le conversioni generate dalla filiera corta.
        </p>
      </div>
    ),
  },
  {
    id: "blueprint-payload",
    question: "Cosa sono i Blueprint e i payload per le API esterne?",
    summary: "Specifiche tecniche pronte all'uso per integrazioni server-to-server.",
    content: (
      <div className="space-y-2 text-xs leading-relaxed text-olive">
        <p>
          Per le piattaforme che vietano la pubblicazione automatizzata dal browser (es. Instagram Graph API, LinkedIn UGC Posts), 
          il modulo genera lo schema dati conforme <code className="rounded bg-mist px-1 py-0.5 font-mono text-forest">WelfareKm0CardInputV5</code>.
        </p>
        <p>
          Questo schema include anagrafica, partner di progetto (promotore, flotta logistica, startup), stime chilometriche e coordinate di conformità, 
          pronto per essere consumato da webhook o microservizi aziendali autorizzati.
        </p>
      </div>
    ),
  },
  {
    id: "shortlink-db-referral",
    question: "Come funziona l'accorciamento dei link nel database e la tracciabilità B2B senza Google Analytics?",
    summary: "Tracciabilità deterministica server-side: zero cookie di terze parti, privacy-first e massima affidabilità per 10.000 dipendenti.",
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-olive">
        <p>
          Per superare le criticità degli strumenti di web analytics commerciali (ad-blocker, firewall e proxy aziendali, banner cookie GDPR non accettati), 
          RADICI adotta un modello di <strong>Internal URL Shortener deterministico</strong> integrato nel database.
        </p>
        <div className="rounded-xl border border-forest/15 bg-paper p-3 space-y-2">
          <p className="font-semibold text-forest">Architettura della tracciabilità server-side:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Generazione Shortlink Univoco:</strong> quando un collaboratore condivide l'attestato, la piattaforma associa l&apos;ID certificato (es. <code className="font-mono text-forest">/c/IMP-23CQN2</code>) al suo account e alla sua azienda.</li>
            <li><strong>Registrazione Immediata al Click:</strong> all&apos;apertura del link, il server incrementa il contatore visite lato backend prima di servire la pagina, garantendo il 100% di precisione anche con ad-blocker attivi.</li>
            <li><strong>Attribuzione Referral Deterministica:</strong> se il collega o l&apos;amico si registra o richiede l&apos;attivazione del welfare per la propria impresa, il sistema riconosce automaticamente chi ha generato l&apos;invito (tramite cookie di prima parte o parametro di sessione).</li>
            <li><strong>Gamification &amp; Report CSR:</strong> le aziende possono visualizzare in tempo reale nel proprio cruscotto quante persone hanno visionato gli attestati dei propri dipendenti e quanti nuovi partner o colleghi sono entrati nel circuito.</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function CertificateFaqModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [openId, setOpenId] = useState<string>("stringa-url");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-sand/30 bg-forest/40 px-3 py-1.5 text-xs font-semibold text-sand hover:bg-forest/80 hover:text-white transition cursor-pointer"
        title="Consulta la guida tecnica su autenticità, integrità e diffusione social"
      >
        <HelpCircle size={14} className="text-gold" />
        <span>FAQ Autenticità &amp; Diffusione</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div
            className="relative w-full max-w-3xl rounded-[28px] border border-forest/10 bg-white shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modale */}
            <div className="flex items-center justify-between border-b border-forest/10 bg-forest px-6 py-5 text-cream">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/20 text-gold border border-gold/30">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight">
                    FAQ: Autenticità, Diffusione &amp; Tracciabilità
                  </h3>
                  <p className="text-[11px] text-sand/80">
                    Architettura digitale e garanzie dei Attestati d&apos;Impatto Km 0
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-cream/70 hover:bg-white/10 hover:text-white transition cursor-pointer"
                aria-label="Chiudi"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenuto Accordion */}
            <div className="p-6 max-h-[72vh] overflow-y-auto space-y-3 bg-cream/40">
              {FAQ_ITEMS.map((item) => {
                const isExpanded = openId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-forest/10 bg-white overflow-hidden shadow-xs transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(isExpanded ? "" : item.id)}
                      className="w-full flex items-start justify-between gap-3 p-4 text-left transition hover:bg-mist/30 cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-serif text-sm sm:text-base font-bold text-forest">
                          {item.question}
                        </h4>
                        <p className="text-[11px] text-olive font-medium">
                          {item.summary}
                        </p>
                      </div>
                      <span className="mt-1 shrink-0 text-olive">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-forest/10 px-4 pt-3 pb-4 bg-white animate-fade-in">
                        {item.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Modale */}
            <div className="flex items-center justify-between border-t border-forest/10 bg-white px-6 py-3.5 text-xs text-olive">
              <span className="font-mono text-[11px]">Circuito RADICI · Conformità L. 61/2022 &amp; D.Lgs. 30/2026</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-cream hover:bg-forest/90 transition cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
