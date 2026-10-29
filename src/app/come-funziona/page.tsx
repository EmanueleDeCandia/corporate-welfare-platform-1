import Link from "next/link";
import { PublicShell } from "@/components/public-shell";

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-5xl px-4 py-12 md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-olive">Modello RADICI</p>
        <h1 className="mt-2 font-serif text-5xl text-forest">Come funziona l&apos;ecosistema</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/80">
          Un circolo virtuoso: l&apos;impresa fa welfare, il dipendente scopre il territorio, la
          community si allarga agli amici che pagano di tasca propria e i fornitori aumentano il
          fatturato B2B e B2C.
        </p>

        <ol className="mt-10 space-y-5">
          {[
            {
              title: "L'impresa attiva il piano",
              text: "Ogni dipendente riceve 1 pernottamento da 50 € e 1 cena KM 0 da 25 €. Il budget virtuale è nominale; l'impresa paga solo quando il dipendente seleziona data e struttura.",
            },
            {
              title: "Il dipendente seleziona data e struttura",
              text: "Sceglie offerta, data e struttura. Un pernottamento e una cena a testa. Extra solo a ridosso della scadenza, se resta circa il 20% inutilizzato, fino al 20% di quei residui e solo a chi ha già usato i propri.",
            },
            {
              title: "Matching Grant dopo il pernottamento",
              text: "Chi ha selezionato un pernottamento può prenotare un evento culturale (fino a 2 posti). Conferma T-7/T-3; senza risposta i posti si liberano. Nessun esborso in caso di assenza.",
            },
            {
              title: "Il kit social certifica l'impatto",
              text: "Una foto del soggiorno riceve il badge ufficiale. Condividere sblocca livelli: Sostenitore Green, Ambassador Locale, Custode del Territorio.",
            },
            {
              title: "L'amico paga, tu guadagni punti",
              text: "Invito + QR unico. L'amico si presenta in struttura, si registra, paga con carta e ottiene un micro-sconto. Tu ricevi +1 Punto Impatto.",
            },
            {
              title: "Il fornitore ha due inbox in una",
              text: "Notifica welfare: emetti fattura all'impresa. Notifica referral: incasso già ricevuto, emetti scontrino all'ospite. Presenze e no-show dal pannello o dal QR.",
            },
          ].map((step, index) => (
            <li key={step.title} className="rounded-[28px] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-gold">0{index + 1}</p>
              <h2 className="mt-2 font-serif text-3xl text-forest">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/75">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-[28px] bg-cream p-6">
          <h2 className="font-serif text-2xl text-forest">Account demo</h2>
          <p className="mt-2 text-sm text-olive">Password unica: radici2026</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>mario.rossi@acme.it — dipendente ACME</li>
            <li>luca.bianchi@acme.it — dipendente ACME</li>
            <li>luigi.bianchi@email.it — amico / consumer</li>
            <li>elena.martini@acme.it — CSR impresa</li>
            <li>elena@lavalle.it — fornitrice Agriturismo La Valle</li>
            <li>chiara.promotori@radici.it — promotori</li>
          </ul>
          <Link href="/login" className="mt-5 inline-block rounded-full bg-forest px-5 py-2 text-sm text-cream">
            Prova la piattaforma
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}