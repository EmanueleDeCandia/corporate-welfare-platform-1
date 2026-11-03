import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export const metadata = {
  title: "Modello di Business & Note Esplicative · RADICI",
  description:
    "Memorandum strategico sulla partnership industriale con Gruppo Illiria, l'architettura dei voucher welfare, la logistica solidale a zero emissioni addizionali e le fonti di marginalità della Startup.",
};

export default function BusinessModelPage() {
  return (
    <PublicShell>
      {/* Intestazione Istituzionale */}
      <section className="border-b border-mist bg-forest py-16 px-4 text-cream md:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-gold">
              Documento Strategico Direzionale
            </span>
            <div className="flex items-center gap-3 text-xs text-cream/70">
              <span>Classificazione: Board & Direzione Generale</span>
              <span>·</span>
              <span>Versione Open Architecture</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-cream">
            Modello Economico, Partnership Industriale e Note Esplicative
          </h1>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-cream/80">
            Analisi organica dell&apos;ecosistema RADICI: la relazione di rete con Gruppo Illiria, l&apos;azzeramento
            dei costi accessori per le Imprese CSR, l&apos;ingegneria del voucher con Matching Grant e la sostenibilità
            della Startup fondata sulla gestione diretta della ristorazione tipica a KM 0.
          </p>

          <div className="pt-4 flex flex-wrap gap-2 text-xs">
            <a
              href="#nota-1"
              className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-cream/90 transition hover:bg-white/15"
            >
              Nota 1 · Gruppo Illiria
            </a>
            <a
              href="#nota-2"
              className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-cream/90 transition hover:bg-white/15"
            >
              Nota 2 · Finanza dei Voucher
            </a>
            <a
              href="#nota-3"
              className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-cream/90 transition hover:bg-white/15"
            >
              Nota 3 · Volano Mini-Vacanza
            </a>
            <a
              href="#nota-4"
              className="rounded-full border border-cream/20 bg-white/5 px-3 py-1 text-cream/90 transition hover:bg-white/15"
            >
              Nota 4 · Valore CSR vs CAM
            </a>
          </div>
        </div>
      </section>

      {/* Contenuto Principale */}
      <main className="mx-auto max-w-5xl px-4 py-12 space-y-16 md:px-8">
        {/* SEZIONE 1: QUADRO DELLA TESI D'IMPRESA */}
        <section className="space-y-6">
          <div className="border-l-2 border-forest pl-4">
            <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold block">
              Capitolo 1 · Sintesi Esecutiva
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
              La Tesi Industriale di RADICI
            </h2>
          </div>

          <div className="rounded-3xl border border-mist bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-ink/90">
            <p>
              RADICI è una piattaforma concepita per trasformare il welfare aziendale territoriale in una leva di
              coesione reale per le comunità dei borghi e delle aree interne. A differenza delle convenzioni
              generaliste, RADICI orienta i flussi economici verso l&apos;accoglienza agrituristica, la filiera corta
              agricola e i teatri storici, massimizzando il ritorno sul territorio. In questa DEMO sono state inserite
              soltanto Imprese CSR ma il raggio di azione equipara Aziende Pubbliche e Aziende Private per
              l&apos;erogazione dei Voucher di Welfare Aziendale. Le Aziende Pubbliche avranno semplicemente un account
              senza possibilità di Sponsorizzazione.
            </p>
          </div>
        </section>

        {/* NOTA 1 */}
        <section id="nota-1" className="space-y-6 scroll-mt-24">
          <div className="border-l-2 border-forest pl-4">
            <span className="font-mono text-xs uppercase tracking-wider text-forest font-semibold block">
              [Nota 1] Focus Metodologico
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
              Relazione Industriale Gruppo Illiria e Modello di Canale
            </h2>
            <p className="text-xs text-olive mt-1">
              Integrazione strategica, accreditamento fiduciario e distinzione tra parco clienti esistente e nuove gare.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-mist bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-ink/90">
              <h3 className="font-serif text-lg font-semibold text-forest">
                1. Assenza di Oneri Economici a Carico del Gruppo
              </h3>
              <p>
                Al Gruppo Illiria non è richiesto alcun conferimento di capitale, fondo di dotazione o finanziamento
                monetario. L&apos;infrastruttura tecnologica, la redazione del Reporting Integrato di Sostenibilità, la
                comunicazione con i media e il coordinamento delle iniziative sul territorio sono interamente gestiti ed
                erogati dalla Startup Promotrice senza costi per le imprese né per il Gruppo.
              </p>

              <h3 className="font-serif text-lg font-semibold text-forest pt-2">
                2. L&apos;Asset Conferito: Accreditamento Istituzionale e Relazioni Industriali
              </h3>
              <p>
                Il ruolo decisivo di Gruppo Illiria consiste nella condivisione del proprio canale fiduciario sul territorio.
                L&apos;apertura delle relazioni con il proprio parco imprese consolidato consente alla Startup di
                interloquire direttamente con i vertici aziendali delle principali realtà industriali regionali,
                garantendo alla piattaforma la massa critica necessaria sin dalla fase iniziale di avviamento.
              </p>

              <h3 className="font-serif text-lg font-semibold text-forest pt-2">
                3. Sinergia a Doppio Senso: Clienti Esistenti vs Nuova Committenza
              </h3>
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                <div className="rounded-2xl border border-forest/15 bg-cream/40 p-4">
                  <h4 className="font-serif text-sm font-semibold text-forest">
                    A) Clienti Esistenti (Sostegno alla Startup)
                  </h4>
                  <p className="mt-1 text-xs text-olive leading-relaxed font-normal">
                    L&apos;accesso a piccole, medie e grandi imprese già clienti di Illiria consente alla Startup di attivare immediatamente i piani di welfare territoriale a costo zero per l&apos;azienda, avviando le economie di scala del circuito ricettivo e agroalimentare necessarie alla propria sostenibilità d&apos;impresa. Senza questa base con cui avviare direttamente le proposte sarebbe arduo conquistare la fiducia necessaria. La maggior parte delle imprese è sottoposta a over promising di marketing: i servizi erogati dalla Startup senza oneri sarebbero percepiti per servizi senza valore.
                  </p>
                </div>

                <div className="rounded-2xl border border-forest/15 bg-cream/40 p-4">
                  <h4 className="font-serif text-sm font-semibold text-forest">
                    B) Nuovi Clienti (Valore Condiviso)
                  </h4>
                  <p className="mt-1 text-xs text-olive leading-relaxed font-normal">
                    Nelle Gare d&apos;Appalto Pubbliche: negli Enti Locali e Unioni di Comuni coinvolti direttamente dalla Startup, Regione, Atenei, Ospedali, l&apos;offerta di Illiria viene valutata in modo preliminare con i vantaggi distintivi riconoscibili della valorizzazione territoriale. In sede di formulazione delle offerte, l&apos;abbatimento dei kilometri addizionali a favore delle produzioni locali, potrebbero aprire opportunità sia per arricchire l&apos;offerta che nella conformità ai Criteri Ambientali Minimi (CAM). La DEMO non ha inserito le Aziende pubbliche nella piattaforma ma la sezione Imprese CSR è dedicata sia ad Aziende pubbliche che private.
                  </p>
                </div>
              </div>

              <h3 className="font-serif text-lg font-semibold text-forest pt-4">
                4. Go to market per il Shared Value con le imprese CSR
              </h3>
              <div className="rounded-2xl border border-gold/40 bg-sand/20 p-5 space-y-3">
                <p className="text-xs text-forest leading-relaxed font-normal">
                  L&apos;azione di contatto diretto verso le imprese CSR condotta direttamente dalla Startup permette un posizionamento focalizzato sui benefici al territorio, escludendo la percezione delle proposte commerciali con i limiti strutturali delle offerte basate sul prezzo e prodotto.
                </p>
                <div className="space-y-2 text-xs text-olive">
                  <p className="font-normal text-forest">La Startup infatti può utilizzare:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      La leva di adesione della logistica integrata a impatto zero per la fornitura e distribuzione di prodotti locali a filiera corta (Km 0) destinati ai dipendenti, promuovendo contestualmente lo sviluppo economico delle aree interne e il sostegno al patrimonio culturale locale.
                    </li>
                    <li>
                      Il sostegno che Gruppo abilita servizi che aumentando la rilevanza per ogni partecipante quali il Reporting Integrato di Sostenibilità (ESG), le attività di comunicazione e media relation, l&apos;advertising, nonché l&apos;organizzazione di tavoli istituzionali e dibattiti di Public Policy correlati agli eventi territoriali.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NOTA 2 */}
        <section id="nota-2" className="space-y-6 scroll-mt-24">
          <div className="border-l-2 border-forest pl-4">
            <span className="font-mono text-xs uppercase tracking-wider text-forest font-semibold block">
              [Nota 2] Focus Metodologico
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
              Architettura Finanziaria dei Voucher, Leva del Matching Grant e Marginalità Startup
            </h2>
            <p className="text-xs text-olive mt-1">
              Dimensione del plafond (75 €), volano della camera doppia e il motore di cassa della ristorazione tipica (~80%).
            </p>
          </div>

          <div className="rounded-3xl border border-mist bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-ink/90">
            <h3 className="font-serif text-lg font-semibold text-forest">
              1. Calibrazione del Plafond (75 €) e Abbattimento Barriere
            </h3>
            <p>
              Il piano per addetto è calibrato su due prestazioni fisse: 50,00 € per il Pernottamento e{" "}
              25,00 € per la Ristorazione KM 0 (plafond totale: 75,00 €). Questa soglia contenuta
              elimina le consuete barriere decisionali dei Consigli di Amministrazione e dei Welfare Manager (spesso
              frenati da richieste di 200-300 € ad addetto), assicurando adesioni estese a zero canoni di piattaforma.
            </p>

            <h3 className="font-serif text-lg font-semibold text-forest pt-2">
              2. La Leva del Matching Grant per Due Persone
            </h3>
            <p>
              A fronte dello stanziamento di 50,00 € per il pernottamento da parte dell&apos;impresa, la Startup stanzia
              un Matching Grant di 50,00 € per due persone a teatro (due ingressi da 25,00 €).
              L&apos;addetto è incentivato a recarsi all&apos;evento in compagnia, convertendo la prenotazione in{" "}
              camera doppia. La seconda quota (50,00 € pagati privatamente) raddoppia il fatturato della
              struttura ricettiva convenzionata, garantendo la totale attrattività economica del circuito.
            </p>

            <h3 className="font-serif text-lg font-semibold text-forest pt-2">
              3. Marginalità Reale della Startup: ~80% sull&apos;Aperitivo-Cena
            </h3>
            <p>
              La sostenibilità della Startup non dipende dalle commissioni sulle camere alberghiere (il 10% presente
              nella demo costituisce una misura parametrica di benchmark). La vera redditività operativa risiede nel
              Voucher Ristorazione KM 0 da 25,00 €:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-olive">
              <li>
                Frequenza Elevata: La fruizione dell&apos;aperitivo o cena presenta un tasso di
                ricorrenza nettamente superiore rispetto al pernottamento.
              </li>
              <li>
                Gestione Diretta: La Startup non opera come semplice intermediario, ma coordina la
                fornitura direttamente in convenzione operativa con strutture selezionate.
              </li>
              <li>
                Margine di Contribuzione: Con un costo industriale delle materie prime stimato in 5-7 €,
                il margine di contribuzione lordo si attesta a circa l&apos;80% (18-20 € netti a voucher),
                rappresentando il generatore principale di flussi di cassa operativi.
              </li>
            </ul>

            <h3 className="font-serif text-lg font-semibold text-forest pt-2">
              4. Tutela Integrale dei Produttori Agricoli
            </h3>
            <p>
              Sui produttori agricoli a KM 0 non viene applicata alcuna commissione d&apos;intermediazione. La regola
              esemplificata nella demo di &quot;1 cesto omaggio ogni 10 venduti&quot; ha carattere parametrico: gli
              accordi di filiera possono prevedere, in alternativa, la fornitura diretta delle materie prime impiegate
              negli aperitivi-cena a tariffe agevolate (massimo 10,00 €), proteggendo sia la marginalità della Startup sia
              il reddito degli agricoltori locali.
            </p>
          </div>
        </section>

        {/* NOTA 3 */}
        <section id="nota-3" className="space-y-6 scroll-mt-24">
          <div className="border-l-2 border-forest pl-4">
            <span className="font-mono text-xs uppercase tracking-wider text-forest font-semibold block">
              [Nota 3] Focus Metodologico
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
              Viste Direzionali Prioritarie e Meccanismo Sistemico della Mini-Vacanza
            </h2>
            <p className="text-xs text-olive mt-1">
              Superamento della perdita strutturale degli spettacoli periferici tramite l&apos;ospitalità rurale di charme.
            </p>
          </div>

          <div className="rounded-3xl border border-mist bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-ink/90">
            <h3 className="font-serif text-lg font-semibold text-forest">
              1. Gerarchia delle Interfacce per il Decisore Strategico
            </h3>
            <p>
              L&apos;esplorazione della piattaforma per il Management di Gruppo Illiria si concentra su due viste:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl border border-mist bg-sand/15 p-4">
                <span className="font-mono font-semibold uppercase text-forest block">Dashboard Impresa (/azienda)</span>
                <p className="mt-1 text-olive">
                  Permette di verificare la totale gratuità dei servizi per il committente, il raddoppio del Matching Grant
                  e la rendicontazione dell&apos;impatto logistico ed economico sul territorio.
                </p>
              </div>
              <div className="rounded-2xl border border-mist bg-sand/15 p-4">
                <span className="font-mono font-semibold uppercase text-forest block">Control Room (/promotori)</span>
                <p className="mt-1 text-olive">
                  Consente di monitorare i volumi transati complessivi (GMV), la composizione del margine operativo primario
                  e il tasso di penetrazione della rete nei diversi distretti regionali.
                </p>
              </div>
            </div>

            <h3 className="font-serif text-lg font-semibold text-forest pt-2">
              2. Il Volano Spettacoli ↔ Ricettività
            </h3>
            <p>
              Le manifestazioni culturali nei borghi storici operano costantemente con bilanci in passivo: la distanza dai
              grandi agglomerati industriali rende impraticabile la trasferta per un solo spettacolo serale. RADICI
              risolve questo vincolo trasformando l&apos;uscita in una mini-vacanza territoriale:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-olive">
              <li>
                Lo Spettacolo traina la Ricettività: Agisce come attrattore immateriale garantito,
                convogliando clientela negli agriturismi e hotel di charme anche nei periodi di media e bassa stagione.
              </li>
              <li>
                La Ricettività traina lo Spettacolo: La certezza di un soggiorno di qualità e di una cena
                tipica per due persone rende desiderabile e giustificato il viaggio a medio raggio.
              </li>
            </ul>
          </div>
        </section>

        {/* NOTA 4 */}
        <section id="nota-4" className="space-y-6 scroll-mt-24">
          <div className="border-l-2 border-forest pl-4">
            <span className="font-mono text-xs uppercase tracking-wider text-forest font-semibold block">
              [Nota 4] Focus Metodologico
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
              La Proposta di Valore per l&apos;Impresa CSR: Distinzione Netta con le Gare CAM
            </h2>
            <p className="text-xs text-olive mt-1">
              Separazione tra i benefici per l&apos;azienda privata e i requisiti tecnici dei contratti pubblici.
            </p>
          </div>

          <div className="rounded-3xl border border-mist bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-ink/90">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-mist rounded-xl">
                <thead className="bg-sand/30 font-serif text-forest border-b border-mist">
                  <tr>
                    <th className="p-3">Destinatario</th>
                    <th className="p-3">Ambito Operativo</th>
                    <th className="p-3">Vantaggi Chiave di Piattaforma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist text-ink/80">
                  <tr>
                    <td className="p-3 font-medium text-forest whitespace-nowrap">
                      Imprese CSR Private<br />
                      <span className="text-[11px] font-normal text-olive">(Clienti e Non Clienti Illiria)</span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">/azienda</td>
                    <td className="p-3">
                      • Zero costi di piattaforma e setup<br />
                      • Servizi di marketing e comunicazione di CSR gratuiti (diffusione Best Practice)<br />
                      • Raddoppio del valore con Matching Grant 50 € per 2 persone<br />
                      • Consegna cesti KM 0 in sede senza spese di spedizione<br />
                      • Sostegno concreto ai produttori grazie alla flotta Illiria
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-forest whitespace-nowrap">
                      Settore Pubblico<br />
                      <span className="text-[11px] font-normal text-olive">(Gare Gruppo Illiria)</span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">Appalti Pubblici</td>
                    <td className="p-3">
                      • Rispondenza Criteri Ambientali Minimi (CAM)<br />
                      • Punteggio tecnico elevato nei bandi (Atenei, Ospedali, Regione)<br />
                      • Azzeramento emissioni di trasporto dedicate (sfruttamento tratte furgoni ordinarie)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="font-serif text-lg font-semibold text-forest pt-2">
              La Flotta Illiria come Strumento di Logistica Solidale
            </h3>
            <p>
              Nella Dashboard dell&apos;Impresa CSR, la sezione &quot;Sinergie Flotta & KM 0&quot; attesta come la flotta
              di Gruppo Illiria venga impiegata per sostenere i produttori agricoli del territorio: recapitando i prodotti
              direttamente in azienda all&apos;interno delle rotte ordinarie, si azzerano le corse individuali e i costi
              logistici che ciascun piccolo produttore dovrebbe sostenere in proprio.
            </p>
          </div>
        </section>

        {/* Pulsanti di Navigazione di Ritorno */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-mist pt-8">
          <Link
            href="/azienda"
            className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-white px-5 py-2.5 text-xs font-semibold text-forest transition hover:bg-cream cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Torna alla Dashboard Impresa (/azienda)</span>
          </Link>

          <Link
            href="/promotori"
            className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-xs font-semibold text-cream transition hover:bg-forestDeep cursor-pointer"
          >
            <span>Vai alla Control Room Promotori (/promotori)</span>
            <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
