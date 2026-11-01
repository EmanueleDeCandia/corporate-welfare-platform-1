import Link from "next/link";
import {
  Building2,
  Users,
  HeartHandshake,
  Store,
  Ticket,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Leaf,
  Gift,
  Coins,
  TrendingUp,
  MapPin,
  FileText,
} from "lucide-react";
import { PublicShell } from "@/components/public-shell";

export const metadata = {
  title: "Come Funziona · RADICI Welfare Territoriale",
  description:
    "Scopri l'ecosistema di welfare aziendale circolare: moltiplicatore 5,1x per i borghi, Matching Grant cultura per i teatri e filiera corta a impatto marginale zero.",
};

export default function HowItWorksPage() {
  return (
    <PublicShell>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-forest text-cream py-20 px-4 md:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-forest/80 to-forest" />
        <div className="relative mx-auto max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold border border-gold/30">
            <Sparkles size={14} /> Ecosistema di Welfare Territoriale Circolare
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream font-medium tracking-tight">
            Come Funziona RADICI
          </h1>
          <p className="mx-auto max-w-3xl text-base sm:text-lg leading-relaxed text-cream/80">
            Una piattaforma rigenerativa dove il welfare aziendale sostiene l&apos;economia reale dei borghi italiani.
            Dalla deducibilità fiscale CSR all&apos;omaggio Matching Grant per i teatri, fino alla filiera corta a zero commissioni.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-16 space-y-20 md:px-6">
        {/* I 4 PILASTRI DELL'ECOSISTEMA */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">I Protagonisti</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-forest">Quattro attori, un unico circolo virtuoso</h2>
            <p className="text-sm text-olive">
              Ogni soggetto dell&apos;ecosistema interagisce con regole contabili, fiscali ed etiche chiare e trasparenti.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 1. IMPRESE CSR */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-forest/10 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                  <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-bold text-forest uppercase tracking-wider">
                    01 · Impresa CSR
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-forest">Sostenibilità & Impatto Territoriale</h3>
                <p className="text-sm text-forest/80 leading-relaxed">
                  L&apos;impresa finanzia il benessere dei propri collaboratori investendo risorse deducibili al 100% nei borghi dell&apos;entroterra.
                </p>
                <ul className="space-y-2.5 text-xs text-forest/90 pt-2 border-t border-mist">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Deducibilità fiscale integrale (Art. 51 TUIR)</strong>: 0% cuneo fiscale su soggiorni e cene welfare.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Moltiplicatore Economico 5,1x</strong>: ogni 1.000€ investiti generano 5.100€ di indotto economico per le comunità locali.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Rating ESG Certificato</strong>: bilancio di sostenibilità con tracciamento CO₂ risparmiata e capitale ridistribuito.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Reciprocità Territoriale 10:1</strong>: ogni 10 cesti acquistati nel circuito, i produttori offrono 1 Cesto Omaggio agli addetti aziendali.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta/80 transition"
                >
                  Accedi come Impresa CSR <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 2. DIPENDENTI & LAVORATORI */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-forest/10 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-forest uppercase tracking-wider">
                    02 · Dipendenti & Famiglie
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-forest">Welfare Esperienziale & Cultura</h3>
                <p className="text-sm text-forest/80 leading-relaxed">
                  I lavoratori fruiscono dei voucher welfare aziendali con libertà di scelta, nessun anticipo di denaro e accesso alla cultura.
                </p>
                <ul className="space-y-2.5 text-xs text-forest/90 pt-2 border-t border-mist">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Zero Anticipi</strong>: pernottamenti in casali e cene degustazione interamente saldati tramite voucher aziendale.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Matching Grant Cultura (50€ Coppia / 25€ Singolo)</strong>: omaggio erogato dai Promotori per biglietti teatrali ed eventi storici nei borghi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Flessibilità Totale & Annullamento Sicuro</strong>: modifica o revoca selezione in 1 click con riaccredito istantaneo nel portafoglio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Cesti Filiera Corta KM 0</strong>: acquisto con ritiro in loco o consegna senza imballaggi monouso.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2">
                <Link
                  href="/esplora"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta/80 transition"
                >
                  Esplora le strutture disponibili <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 3. COMMUNITY & AMICI INVITATI */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-forest/10 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-terracotta/10 text-terracotta flex items-center justify-center">
                    <HeartHandshake size={24} />
                  </div>
                  <span className="rounded-full bg-terracotta/10 px-3 py-1 text-xs font-bold text-terracotta uppercase tracking-wider">
                    03 · Community & Amici
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-forest">Turismo Partecipato & Sconto 10%</h3>
                <p className="text-sm text-forest/80 leading-relaxed">
                  Gli amici invitati dai lavoratori beneficiano di tariffe convenzionate e contribuiscono all&apos;economia locale.
                </p>
                <ul className="space-y-2.5 text-xs text-forest/90 pt-2 border-t border-mist">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Micro-Sconto Community 10%</strong>: applicato all&apos;istante su soggiorni, degustazioni e cesti tipici tramite link invito.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Separazione Fiscale Garante</strong>: se accompagnano un dipendente, la quota welfare del lavoratore resta a 0€ e l&apos;ospite salda la propria quota scontata.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Anti-Overbooking Etico</strong>: riconferma di presenza obbligatoria per tutelare la disponibilità dei posti per tutti.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Punti Impatto Sociale</strong>: ogni prenotazione conclusa assegna punti reputazionali anche a chi ha inviato l&apos;invito.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2">
                <Link
                  href="/registrati"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta/80 transition"
                >
                  Unisciti alla Community <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 4. FORNITORI, TEATRI & PRODUTTORI */}
            <div className="rounded-[32px] bg-white p-8 shadow-sm border border-forest/10 flex flex-col justify-between space-y-6 hover:shadow-md transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Store size={24} />
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    04 · Fornitori & Territorio
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-forest">Trasparenza Contabile & Zero Fee</h3>
                <p className="text-sm text-forest/80 leading-relaxed">
                  Operatori ricettivi, frantoi, caseifici e spazi teatrali dispongono di cruscotti digitali dedicati per gestire incassi e presenze.
                </p>
                <ul className="space-y-2.5 text-xs text-forest/90 pt-2 border-t border-mist">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Fatturazione B2B Diretta alle Imprese</strong>: istruzioni chiare e fatture generate solo su soggiorni realmente confermati.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Zero Fee sui Produttori Locali</strong>: la startup trattiene 0% di commissioni sui cesti a KM 0 (100% dell&apos;incasso all&apos;agricoltore).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Botteghino Teatrale Digitale</strong>: convalida istantanea dei posti Matching Grant omaggio finanziati dai Promotori.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Nessun Addebito su Annullamenti</strong>: il server blocca la fatturazione ed emette avviso immediato in caso di revoca dell&apos;ospite.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta/80 transition"
                >
                  Accedi all&apos;Area Operatori <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW CICLICO IN 4 FASI */}
        <section className="rounded-[32px] bg-cream/40 border border-forest/10 p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Il Ciclo Operativo</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-forest">Come si sviluppa l&apos;esperienza</h2>
            <p className="text-sm text-olive">
              Dalla stipula del piano welfare aziendale fino alla convalida sul territorio.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-white p-6 border border-forest/5 shadow-sm space-y-3">
              <span className="font-mono text-2xl font-bold text-gold">Step 01</span>
              <h4 className="font-serif text-lg font-bold text-forest">Accordo & Plafond CSR</h4>
              <p className="text-xs text-forest/75 leading-relaxed">
                L&apos;Impresa attiva il piano welfare annuale e assegna i voucher pernottamento (50€) e cena (25€) nel portafoglio dei propri dipendenti.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-forest/5 shadow-sm space-y-3">
              <span className="font-mono text-2xl font-bold text-gold">Step 02</span>
              <h4 className="font-serif text-lg font-bold text-forest">Scelta Borgo & Omaggio</h4>
              <p className="text-xs text-forest/75 leading-relaxed">
                Il dipendente seleziona la struttura. Automaticamente i Promotori erogano l&apos;omaggio Matching Grant (50€ coppia / 25€ singolo) per lo spettacolo a teatro.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-forest/5 shadow-sm space-y-3">
              <span className="font-mono text-2xl font-bold text-gold">Step 03</span>
              <h4 className="font-serif text-lg font-bold text-forest">Conferma & Check-in QR</h4>
              <p className="text-xs text-forest/75 leading-relaxed">
                L&apos;ospite riconferma la presenza 7 giorni prima per confermare i posti. Sul posto inquadra il QR code per validare soggiorno e ingresso a teatro.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-forest/5 shadow-sm space-y-3">
              <span className="font-mono text-2xl font-bold text-gold">Step 04</span>
              <h4 className="font-serif text-lg font-bold text-forest">Reciprocità & Rendiconto</h4>
              <p className="text-xs text-forest/75 leading-relaxed">
                Il fornitore emette fattura all&apos;azienda. L&apos;Impresa riceve il report ESG con moltiplicatore 5,1x e matura cesti omaggio dai produttori (regola 10:1).
              </p>
            </div>
          </div>
        </section>

        {/* LOGISTICA SOSTENIBILE & TABELLA SCIENTIFICA CO2 */}
        <section className="rounded-[32px] bg-forest text-cream p-8 sm:p-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-gold">
                <Leaf size={14} /> Principio di Sostenibilità Ambientale Marginale Zero
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-cream mt-2">
                Filiera Corta Senza Spedizioni a Vuoto
              </h3>
            </div>
            <span className="rounded-full bg-emerald-800/80 px-3.5 py-1 text-xs font-bold text-cream border border-emerald-600/40 shrink-0">
              0,265 kg CO₂ evitati per km
            </span>
          </div>

          <p className="text-sm text-cream/80 max-w-3xl leading-relaxed">
            Nel circuito RADICI non si promettono numeri arbitrari: la GDO industriale è altamente efficiente su larga scala.
            Il reale ed esclusivo vantaggio della filiera corta RADICI risiede nel fatto che <strong>i km logistici dedicati sono azzerati</strong>:
            il cesto viene ritirato direttamente in loco durante il soggiorno, oppure recapitato lungo il tragitto ordinario dell&apos;operatore o flotta partner che si sposta per i propri prodotti (sinergie di trasporto a impatto marginale zero, eliminando corrieri espressi ed imballaggi monouso).
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border border-white/10 rounded-2xl overflow-hidden">
              <thead className="bg-white/10 text-gold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tratta Dedicata Eliminata</th>
                  <th className="py-3 px-4">Carburante Non Bruciato</th>
                  <th className="py-3 px-4">CO₂ Non Emessa</th>
                  <th className="py-3 px-4">Parametro di Riferimento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-cream/90 bg-white/5">
                <tr>
                  <td className="py-2.5 px-4 font-mono font-bold">1 km</td>
                  <td className="py-2.5 px-4">0,10 litri</td>
                  <td className="py-2.5 px-4 font-bold text-gold">265 grammi (0,265 kg)</td>
                  <td className="py-2.5 px-4 text-cream/70">Furgone diesel standard (10 L/100 km, 2,65 kg CO₂/L)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-bold">50 km (tratta media a cesto)</td>
                  <td className="py-2.5 px-4">5,00 litri</td>
                  <td className="py-2.5 px-4 font-bold text-gold">13,25 kg CO₂</td>
                  <td className="py-2.5 px-4 text-cream/70">Corriere espresso dedicato a vuoto azzerato</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-bold">100 km</td>
                  <td className="py-2.5 px-4">10,00 litri</td>
                  <td className="py-2.5 px-4 font-bold text-gold">26,50 kg CO₂</td>
                  <td className="py-2.5 px-4 text-cream/70">Tratta interprovinciale eliminata</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* TABELLA ACCOUNT DEMO OPERATIVI PER LA PROVA */}
        <section className="rounded-[32px] bg-white p-8 sm:p-12 shadow-sm border border-forest/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Ambiente Interattivo Demo</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-forest mt-1">Credenziali di Accesso ai Ruoli</h3>
              <p className="text-xs text-olive mt-0.5">
                Accedi con uno dei profili pre-configurati per esplorare in tempo reale le dashboard e i flussi dell&apos;ecosistema.
              </p>
            </div>
            <div className="bg-cream/60 px-3.5 py-1.5 rounded-full border border-forest/10 shrink-0 text-xs text-forest font-medium">
              Password universale demo: <strong className="font-mono text-terracotta">radici2026</strong>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            <div className="rounded-2xl bg-cream/30 p-4 border border-forest/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-forest bg-forest/10 px-2 py-0.5 rounded">
                Startup Promotrice
              </span>
              <p className="font-medium text-sm text-forest mt-2">Chiara Valenti</p>
              <p className="font-mono text-xs text-olive truncate">chiara.promotori@radici.it</p>
              <p className="text-[11px] text-forest/70 pt-1">Cruscotto Promotori, Matching Grant, CMS e Filiera KM 0</p>
            </div>

            <div className="rounded-2xl bg-cream/30 p-4 border border-forest/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Impresa CSR
              </span>
              <p className="font-medium text-sm text-forest mt-2">Elena Martini</p>
              <p className="font-mono text-xs text-olive truncate">elena.martini@acme.it</p>
              <p className="text-[11px] text-forest/70 pt-1">Pannello Aziendale ACME, Plafond, Fatture B2B e Rating ESG</p>
            </div>

            <div className="rounded-2xl bg-cream/30 p-4 border border-forest/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-gold bg-gold/15 px-2 py-0.5 rounded">
                Dipendente Welfare
              </span>
              <p className="font-medium text-sm text-forest mt-2">Mario Rossi</p>
              <p className="font-mono text-xs text-olive truncate">mario.rossi@acme.it</p>
              <p className="text-[11px] text-forest/70 pt-1">Portafoglio voucher, omaggio Matching Grant e cesti</p>
            </div>

            <div className="rounded-2xl bg-cream/30 p-4 border border-forest/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded">
                Ospite Community
              </span>
              <p className="font-medium text-sm text-forest mt-2">Luigi Bianchi</p>
              <p className="font-mono text-xs text-olive truncate">luigi.bianchi@email.it</p>
              <p className="text-[11px] text-forest/70 pt-1">Amico invitato con sconto convenzione del 10%</p>
            </div>

            <div className="rounded-2xl bg-cream/30 p-4 border border-forest/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                Fornitore Ricettivo
              </span>
              <p className="font-medium text-sm text-forest mt-2">Elena Conti</p>
              <p className="font-mono text-xs text-olive truncate">elena@lavalle.it</p>
              <p className="text-[11px] text-forest/70 pt-1">Agriturismo La Valle: distinta B2B e convalida presenze</p>
            </div>

            <div className="rounded-2xl bg-cream/30 p-4 border border-forest/5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Teatro Convenzionato
              </span>
              <p className="font-medium text-sm text-forest mt-2">Paolo Luzi</p>
              <p className="font-mono text-xs text-olive truncate">paolo@teatrolauro.it</p>
              <p className="text-[11px] text-forest/70 pt-1">Teatro Lauro Rossi: botteghino Matching Grant 2 posti</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-mist">
            <p className="text-xs text-olive">
              Vuoi provare direttamente l&apos;esperienza interattiva?
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-full bg-forest px-6 py-2.5 text-center text-xs font-semibold text-cream hover:bg-forest/90 transition shadow-sm"
              >
                Accedi alla Piattaforma
              </Link>
              <Link
                href="/esplora"
                className="w-full sm:w-auto rounded-full bg-white border border-forest/20 px-6 py-2.5 text-center text-xs font-semibold text-forest hover:bg-forest/5 transition"
              >
                Esplora i Luoghi
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
