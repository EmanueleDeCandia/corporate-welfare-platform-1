"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight, BookOpen } from "lucide-react";

export type NoteId = "nota-1" | "nota-2" | "nota-3" | "nota-4";

export interface ExplanatoryNoteData {
  id: NoteId;
  badgeLabel: string;
  title: string;
  subtitle: string;
  summaryPoints: {
    label: string;
    text: string;
  }[];
  strategicTakeaway: string;
  docAnchor: string;
}

export const EXPLANATORY_NOTES: Record<NoteId, ExplanatoryNoteData> = {
  "nota-1": {
    id: "nota-1",
    badgeLabel: "Nota 1",
    title: "Relazione Industriale Gruppo Illiria e Modello di Canale",
    subtitle: "Partnership industriale, accreditamento fiduciario e sinergia a doppio raggio",
    summaryPoints: [
      {
        label: "Nessun Oneri Finanziario Richiesto",
        text: "Al Gruppo Illiria non è richiesto alcun conferimento di capitale o finanziamento monetario. Infrastruttura tecnologica, Reporting Integrato di Sostenibilità e comunicazione sono interamente sviluppati ed erogati dalla Startup Promotrice senza costi.",
      },
      {
        label: "L'Asset Conferito: Relazioni Industriali",
        text: "Il ruolo primario di Illiria risiede nella condivisione del proprio canale fiduciario: l'apertura delle relazioni con il proprio parco imprese consolidato consente alla Startup di presentarsi direttamente ai vertici delle prime 100 aziende regionali, garantendo la massa critica iniziale.",
      },
      {
        label: "A) Clienti Esistenti (Sostegno alla Startup)",
        text: "L'accesso a piccole, medie e grandi imprese già clienti di Illiria consente alla Startup di attivare immediatamente i piani di welfare territoriale a costo zero per l'azienda, avviando le economie di scala necessarie. Senza questa base fiduciaria con cui avviare direttamente le proposte sarebbe arduo conquistare la fiducia necessaria: di fronte all'over promising di marketing, i servizi erogati senza oneri sarebbero percepiti come servizi senza valore.",
      },
      {
        label: "B) Nuovi Clienti (Valore Condiviso)",
        text: "Nelle Gare d'Appalto Pubbliche: negli Enti Locali e Unioni di Comuni coinvolti direttamente dalla Startup, Regione, Atenei, Ospedali, l'offerta di Illiria viene valutata in modo preliminare con i vantaggi distintivi riconoscibili della valorizzazione territoriale. In sede di formulazione delle offerte, l'abbatimento dei kilometri addizionali a favore delle produzioni locali, potrebbero aprire opportunità sia per arricchire l'offerta che nella conformità ai Criteri Ambientali Minimi (CAM). La DEMO non ha inserito le Aziende pubbliche nella piattaforma ma la sezione Imprese CSR è dedicata sia ad Aziende pubbliche che private.",
      },
      {
        label: "4. Go to market per il Shared Value con le imprese CSR",
        text: "L'azione di contatto diretto della Startup posiziona la proposta sui benefici al territorio, superando i limiti delle offerte basate su prezzo e prodotto. La Startup usa la leva della logistica integrata a impatto zero per i prodotti KM 0 ai dipendenti e i servizi abilitati dal Gruppo: Reporting Integrato ESG, media relation, advertising e tavoli istituzionali di Public Policy.",
      },
    ],
    strategicTakeaway:
      "La partnership trasforma la capillarità distributiva e fiduciaria di Illiria in un motore di coesione territoriale, senza esborso monetario per il Gruppo.",
    docAnchor: "nota-1",
  },
  "nota-2": {
    id: "nota-2",
    badgeLabel: "Nota 2",
    title: "Architettura Finanziaria dei Voucher, Leva del Matching Grant e Marginalità Startup",
    subtitle: "Plafond contenuto (75€), moltiplicatore camera doppia e marginalità reale (~80% su Ristorazione KM 0)",
    summaryPoints: [
      {
        label: "Abbattimento Barriere CSR (Plafond 75€)",
        text: "La ripartizione fissa (50€ pernottamento + 25€ ristorazione KM 0) abbatte le resistenze deliberative dei Consigli di Amministrazione rispetto a programmi convenzionali da 200-300€, favorendo l'adesione di massa a zero canoni di piattaforma.",
      },
      {
        label: "La Leva del Matching Grant per Due Persone",
        text: "A fronte dei 50€ stanziati dall'impresa per la camera, la Startup raddoppia il valore erogando 50€ per 2 ingressi a teatro (25€ cad.). Questo incentiva l'addetto a prenotare una camera doppia, attivando la seconda quota privata (50€) e raddoppiando il ricavo della struttura ricettiva.",
      },
      {
        label: "Marginalità Reale della Startup: ~80% sull'Aperitivo-Cena",
        text: "La sostenibilità economica della Startup non dipende dalle commissioni d'intermediazione sulle camere, ma dal Voucher Ristorazione da 25€. La Startup gestisce la fornitura direttamente con strutture partner: a fronte di un costo materie prime di 5-7€, il margine di contribuzione lordo si attesta a circa l'80% (18-20€ netti a voucher).",
      },
      {
        label: "Zero Prelievo sui Produttori Agricoli KM 0",
        text: "Nessuna trattenuta percentuale è applicata sui produttori agricoli. La formula di cessione 10:1 mostrata nella demo ha mero valore modellistico ed è alternabile con accordi di cessione materie prime per la ristorazione a tariffa agevolata (max 10€).",
      },
    ],
    strategicTakeaway:
      "L'Aperitivo-Cena da 25€ costituisce il motore di autofinanziamento della Startup; il Matching Grant per 2 persone raddoppia l'indotto per le strutture ricettive locali.",
    docAnchor: "nota-2",
  },
  "nota-3": {
    id: "nota-3",
    badgeLabel: "Nota 3",
    title: "Viste Direzionali Prioritarie e Meccanismo Sistemico della Mini-Vacanza",
    subtitle: "Superamento della perdita strutturale degli eventi culturali attraverso la ricettività locale",
    summaryPoints: [
      {
        label: "Gerarchia delle Viste per il Decisore Strategico",
        text: "Due cruscotti prioritari: la Dashboard Impresa CSR (/azienda) per verificare la totale gratuità dei servizi e la Control Room Promotori (/promotori) per monitorare i volumi aggregati e la redditività operativa di circuito.",
      },
      {
        label: "Il Limite Strutturale degli Eventi Culturali nei Borghi",
        text: "Le manifestazioni culturali nei borghi storici operano storicamente in perdita strutturale: la distanza dai centri industriali rende insostenibile la trasferta per un solo spettacolo serale di 90 minuti.",
      },
      {
        label: "La Soluzione: La Mini-Vacanza Territoriale",
        text: "L'integrazione di spettacolo teatrale, pernottamento e cena tipica trasforma l'evento in una micro-destinazione di coesione, superando ogni barriera chilometrica per i dipendenti.",
      },
      {
        label: "Traino Bidirezionale Simbiotico",
        text: "Lo spettacolo attira il lavoratore e riempie le strutture nei periodi di spalla; l'ospitalità e la ristorazione rendono desiderabile il viaggio culturale. La monetizzazione congiunta rende l'intero sistema profittevole e autosufficiente.",
      },
    ],
    strategicTakeaway:
      "Nessun evento culturale si autosostiene da solo: la combinazione organica con ricettività e ristorazione crea un modello economico solido e scalabile.",
    docAnchor: "nota-3",
  },
  "nota-4": {
    id: "nota-4",
    badgeLabel: "Nota 4",
    title: "Proposta di Valore per l'Impresa CSR e Distinzione con Gare CAM",
    subtitle: "Separazione netta tra i benefici dell'impresa privata e i criteri di gara pubblica",
    summaryPoints: [
      {
        label: "Zero Oneri di Gestione e Attivazione Piattaforma",
        text: "Il 100% dell'investimento deliberato dall'impresa CSR confluisce direttamente nei voucher dei lavoratori; nessun costo di setup o canone periodico viene fatturato all'azienda.",
      },
      {
        label: "Servizi di Marketing e Comunicazione CSR Gratuiti",
        text: "La Startup cura interamente a costo zero la redazione dei casi studio, la comunicazione delle Best Practice aziendali sui media e il Reporting Integrato di Sostenibilità, rafforzando la reputazione aziendale.",
      },
      {
        label: "Raddoppio del Valore Erogato (Matching Grant 50€)",
        text: "L'impresa finanzia 50€ per il soggiorno e l'addetto riceve anche l'evento culturale per due persone (50€) finanziato dalla Startup, massimizzando il ritorno sul benessere aziendale.",
      },
      {
        label: "Flotta Illiria come Logistica Solidale a Beneficio dei Produttori",
        text: "I prodotti KM 0 vengono consegnati in azienda con i mezzi del Gruppo, sollevando i piccoli produttori locali dai costi e dalle tratte individuali di trasporto ed evitando tragitti dedicati a vuoto.",
      },
      {
        label: "Distinzione Rigorosa con i Criteri CAM",
        text: "I Criteri Ambientali Minimi (CAM) appartengono unicamente agli appalti pubblici in cui Gruppo Illiria compete (Atenei, Ospedali, Regione), dove la filiera locale e le consegne a impatto zero conferiscono il massimo punteggio tecnico.",
      },
    ],
    strategicTakeaway:
      "Per l'impresa CSR la piattaforma è un moltiplicatore reputazionale e di benessere a costo zero; per la PA e le gare d'appalto è la garanzia di conformità CAM.",
    docAnchor: "nota-4",
  },
};

interface ExplanatoryNoteTriggerProps {
  noteId: NoteId;
  variant?: "badge" | "button" | "inline";
  className?: string;
  customLabel?: string;
}

export function ExplanatoryNoteTrigger({
  noteId,
  variant = "badge",
  className = "",
  customLabel,
}: ExplanatoryNoteTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const note = EXPLANATORY_NOTES[noteId];

  if (!note) return null;

  return (
    <>
      {variant === "badge" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={`Apri ${note.title}`}
          className={`inline-flex items-center gap-1 rounded border border-forest/30 bg-forest/5 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-forest transition hover:border-forest hover:bg-forest hover:text-cream cursor-pointer ${className}`}
        >
          <span>[{customLabel || note.badgeLabel}]</span>
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-white px-3 py-1.5 text-xs font-medium text-forest shadow-sm transition hover:border-forest/40 hover:bg-cream/50 cursor-pointer ${className}`}
        >
          <BookOpen size={13} className="text-olive" />
          <span>{customLabel || `${note.badgeLabel}: ${note.title}`}</span>
        </button>
      )}

      {variant === "inline" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`font-mono text-xs font-semibold underline decoration-dotted underline-offset-4 text-forest hover:text-forest/80 cursor-pointer ${className}`}
        >
          {customLabel || `[${note.badgeLabel}]`}
        </button>
      )}

      {isOpen && (
        <ExplanatoryNoteModal note={note} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

interface ExplanatoryNoteModalProps {
  note: ExplanatoryNoteData;
  onClose: () => void;
}

export function ExplanatoryNoteModal({ note, onClose }: ExplanatoryNoteModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-forestDeep/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-forest/20 bg-cream p-6 shadow-2xl md:p-8 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intestazione */}
        <div className="flex items-start justify-between gap-4 border-b border-mist pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-forest/5 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-forest">
              {note.badgeLabel} · Nota Esplicativa di Metodologia
            </div>
            <h2 id="note-modal-title" className="mt-2 font-serif text-2xl text-forest">
              {note.title}
            </h2>
            <p className="mt-1 text-xs text-olive leading-relaxed">{note.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra"
            className="grid h-8 w-8 place-items-center rounded-full border border-forest/15 bg-white text-forest transition hover:bg-forest hover:text-cream cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corpo: Punti Chiave */}
        <div className="my-6 space-y-4 text-ink">
          {note.summaryPoints.map((point, idx) => (
            <div key={idx} className="rounded-2xl border border-mist bg-white p-4">
              <h3 className="font-serif text-sm font-semibold text-forest">
                {point.label}
              </h3>
              <p className="mt-1.5 text-xs text-olive leading-relaxed">
                {point.text}
              </p>
            </div>
          ))}

          {/* Sintesi Strategica */}
          <div className="rounded-2xl border border-gold/40 bg-sand/20 p-4">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-forest/70 block">
              Principio Strategico Chiave
            </span>
            <p className="mt-1 text-xs font-medium text-forest leading-relaxed">
              {note.strategicTakeaway}
            </p>
          </div>
        </div>

        {/* Piede: Chiusura & Link alla Pagina Completa */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-mist pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-forest/20 bg-white px-4 py-2 text-xs font-semibold text-forest transition hover:bg-mist cursor-pointer"
          >
            Chiudi Scheda
          </button>

          <Link
            href={`/business-model#${note.docAnchor}`}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-forest px-5 py-2 text-xs font-semibold text-cream transition hover:bg-forestDeep cursor-pointer"
          >
            <span>Consulta Documento di Modello Economico</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
