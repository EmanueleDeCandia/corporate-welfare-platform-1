import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { FlowDiagram } from "@/components/duna-diagrams";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <section className="overflow-hidden">
        <img src="/images/hero.jpg" alt="" className="h-48 w-full object-cover md:h-64" />
      </section>
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-olive">Modello RADICI</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-forest md:text-5xl">
          Come funziona l&apos;ecosistema
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-olive">
          Un circolo: l&apos;impresa fa welfare, il dipendente scopre il territorio, gli amici pagano di
          tasca propria e i fornitori aumentano il fatturato B2B e B2C.
        </p>

        <div className="relative mt-12 overflow-hidden rounded-[28px]">
          <img
            src="/images/abstract-blur.jpg"
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-[1px]"
          />
          <div className="relative py-16">
            <FlowDiagram />
          </div>
        </div>

        <ol className="mt-12 space-y-4">
          {[
            {
              title: "L'impresa attiva il piano",
              text: "Ogni dipendente riceve 1 pernottamento da 50 € e 1 cena KM 0 da 25 €. Il budget virtuale è nominale; l'impresa paga solo quando il dipendente seleziona data e struttura. Non è prevista alcuna commissione per piattaforma e per tutti i servizi di comunicazione erogati (non inseriti nella DEMO).",
            },
            {
              title: "Il dipendente seleziona data e struttura",
              text: "Sceglie offerta, data e struttura. Extra solo a ridosso della scadenza, se resta circa il 20% inutilizzato, fino al 20% di quei residui e solo a chi ha già usato i propri. I dipendenti possono ricevere in sede anche prodotti a Km 0 scontati.",
            },
            {
              title: "Matching Grant dopo il pernottamento",
              text: "Chi ha selezionato un pernottamento può prenotare un evento culturale (per 2 posti). La Startup e Promotori raddoppiano con questo omaggio il budget del Voucher ricevuto della propria impresa. Conferma T-7/T-3; senza risposta i posti si liberano. Nessun esborso in caso di assenza.",
            },
            {
              title: "Sistema di Referral e Kit social diffonde e certifica l'impatto",
              text: "Una foto del soggiorno riceve il badge ufficiale. Condividere sblocca livelli: Sostenitore Green, Ambassador Locale, Custode del Territorio. Ogni addetto può invitare e iscrivere direttamente amici, partner e famigliari per utilizzare l'Omaggio in Biglietti e servizi locali.",
            },
            {
              title: "L'amico invitato ottiene sconti e credenziali per altri benefici",
              text: "Invito + QR unico. L'amico /a o partner viene registrato automaticamente e può pagare dal suo account con lo sconto. Quando si presenta in struttura un QR Code lo indirizza direttamente nel sistema di pagamento scontato. Chi lo ha invitato riceve +1 Punto Impatto.",
            },
            {
              title: "RADICI intermedia, il fornitore fattura",
              text: "Alla selezione del Voucher nasce il prospetto (committente, importo, Art. 51 TUIR). Il fornitore emette la fattura nel proprio gestionale e su RADICI inserisce solo numero e data, poi lo stato Da saldare → Saldato. La piattaforma predispone tutti gli estremi per la fatturazione con separazione contabile conforme alla gestione.",
            },
            {
              title: "Sostenibilità del modello",
              text: "Aperitivi-Cena solidali con Produttori Locali coprono il costo del Matching Grant di 50€ per due persone. Le imprese CSR non hanno alcuna commissione per la piattaforma e per gli ulteriori servizi di comunicazione che saranno coordinati e integrati nella piattaforma stessa. Accordi con i servizi di ospitalità beneficiari permettono la sostenibilità economica dei benefici sociali creati per ogni partner.",
            },
          ].map((step, index) => (
            <li key={step.title} className="rounded-2xl bg-white p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.16em] text-olive">0{index + 1}</p>
              <h2 className="mt-2 font-serif text-2xl text-forest md:text-3xl">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-olive">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link
            href="/login"
            className="inline-block rounded-full bg-forest px-7 py-3 text-sm text-cream hover:bg-forest-deep"
          >
            Prova la piattaforma
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}
