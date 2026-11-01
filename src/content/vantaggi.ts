/**
 * Copy editoriale della pagina /vantaggi ("I vantaggi della partecipazione").
 *
 * Fonte unica dei testi: la pagina è solo rendering. I numeri di sistema
 * arrivano dal database (src/lib/data.ts), i claim dichiarati da
 * src/content/vantaggi-claims.ts.
 */

export type Stakeholder = {
  key: string;
  label: string;
  benefit: string;
};

export type Module = {
  key: string;
  index: string;
  title: string;
  text: string;
  highlight: string;
};

export type BenefitRow = {
  key: string;
  who: string;
  need: string;
  solution: string;
  advantage: string;
};

export type ProcessStep = {
  key: string;
  title: string;
  text: string;
  short: string;
};

export type ImpactIndicator = {
  key: string;
  title: string;
  text: string;
};

export const POSITIONING = {
  eyebrow: "Modello RADICI",
  title: "Ecosistema d'Impatto e Welfare Territoriale Integrato",
  subtitle:
    "La prima soluzione unificata che integra Welfare Aziendale, Distribuzione Automatica Smart, Filiera Fresca Km 0 e Promozione Culturale del Territorio.",
};

export const ECOSYSTEM_INTRO =
  "I tradizionali servizi di ristoro da ufficio e benefit aziendali vengono trasformati in una rete integrata ad alto impatto. Unendo la flessibilità del Welfare Aziendale, la qualità del Vending Smart, la sostenibilità della Filiera Km 0 e il sostegno al Settore Culturale Locale, generiamo valore condiviso per tutti gli attori coinvolti.";

export const stakeholders: Stakeholder[] = [
  {
    key: "imprese",
    label: "Imprese e Direttori HR",
    benefit:
      "Piattaforma integrata a costo zero sul capitale, deducibilità fiscale al 100%, retention dipendenti e reportistica ESG avanzata per i capitolati di gara, affiancati da servizi di comunicazione dedicati e un posizionamento d'immagine superiore alle sponsorizzazioni tradizionali.",
  },
  {
    key: "dipendenti",
    label: "Dipendenti e Collaboratori",
    benefit:
      "Voucher per hotel e ristorazione, spesa di prodotti freschi Km 0 consegnata direttamente sul posto di lavoro e biglietti omaggio per eventi culturali.",
  },
  {
    key: "produttori",
    label: "Produttori Locali a Km 0",
    benefit:
      "Accesso a una rete di migliaia di lavoratori con logistica integrata a zero emissioni aggiuntive e azzeramento dei costi di trasporto.",
  },
  {
    key: "teatri",
    label: "Teatri e Operatori dello Spettacolo",
    benefit:
      "Finanziamento diretto delle produzioni culturali tramite Matching Grant e ampliamento del pubblico sul territorio.",
  },
];

export const modules: Module[] = [
  {
    key: "voucher",
    index: "01",
    title: "Piattaforma Welfare e Ingegneria dei Voucher",
    text: "I budget CSR e welfare allocati dalle aziende vengono trasformati in voucher utilizzabili dai dipendenti per soggiorni in hotel/agriturismi (50 €) ed esperienze gastronomiche tipiche (25 €), garantendo flessibilità e totale deducibilità fiscale.",
    highlight: "50 € + 25 €",
  },
  {
    key: "km0",
    index: "02",
    title: "Spesa Fresca Km 0 e Logistica a Zero Emissioni",
    text: "I lavoratori ordinano panieri di prodotti locali via piattaforma web. La consegna avviene sfruttando i furgoni già impiegati per i giri di ricarica dei distributori, eliminando i mezzi extra su strada e abbattendo le emissioni di CO₂.",
    highlight: "0 mezzi extra",
  },
  {
    key: "grant",
    index: "03",
    title: "Matching Grant per Spettacoli e Ospitalità Territoriale",
    text: "Grazie alla copertura dei biglietti d'ingresso per eventi culturali tramite Matching Grant, ogni dipendente può accedere a weekend esperienziali completi senza costi vivi proibitivi, innescando una ricaduta economica positiva moltiplicata sul territorio.",
    highlight: "2 posti omaggio",
  },
];

export const benefitMatrix: BenefitRow[] = [
  {
    key: "imprese",
    who: "Imprese e Direttori HR",
    need: "Retention del personale, benefici fiscali, reputazione ESG e forte posizionamento d'immagine extra-aziendale",
    solution:
      "Conversione budget CSR in welfare territoriale, reporting avanzato e servizi di comunicazione dedicati dai promotori",
    advantage:
      "Deducibilità 100%, riduzione del churn (−80%), dossier CO₂ certificato, engagement dei dipendenti e ritorni di immagine imparagonabili rispetto alle tradizionali sponsorizzazioni.",
  },
  {
    key: "dipendenti",
    who: "Dipendenti e Collaboratori",
    need: "Power welfare utile, conciliazione vita-lavoro e spesa di qualità",
    solution: "Voucher hotel/food, consegna prodotti Km 0 sul posto di lavoro e biglietti per spettacoli",
    advantage:
      "Soggiorni a costi vivi azzerati, accesso diretto a cibo fresco locale e tempo libero di qualità con la famiglia.",
  },
  {
    key: "produttori",
    who: "Produttori Locali Km 0",
    need: "Nuovi canali di vendita diretta senza costi di intermediazione o logistica",
    solution: "Consegna dei panieri tramite i furgoni del servizio di ristoro ordinario",
    advantage:
      "Azzeramento spese di trasporto, accesso immediato a un bacino di migliaia di consumatori e valorizzazione del territorio.",
  },
  {
    key: "teatri",
    who: "Teatri e Operatori Culturali",
    need: "Sostegno finanziario continuativo e ampliamento del pubblico in sala",
    solution: "Copertura finanziaria dei biglietti tramite Matching Grant e promozione congiunta",
    advantage:
      "Retribuzione garantita per artisti e maestranze, fidelizzazione del pubblico e valorizzazione del patrimonio artistico.",
  },
];

export const processSteps: ProcessStep[] = [
  {
    key: "attivazione",
    title: "Attivazione Convenzione Welfare",
    text: "L'azienda definisce il budget deducibile CSR e abilita la piattaforma welfare integrata per i propri collaboratori.",
    short: "Convenzione",
  },
  {
    key: "scelta",
    title: "Scelta Benefit e Spesa in Piattaforma",
    text: "I dipendenti ordinano i propri panieri di prodotti Km 0 o riscattano voucher per hotel e ristoranti tipici del territorio.",
    short: "Scelta benefit",
  },
  {
    key: "fruizione",
    title: "Consegna e Fruizione sul Territorio",
    text: "I prodotti Km 0 arrivano direttamente in ufficio senza mezzi extra, mentre i biglietti omaggio attivano l'esperienza nel weekend.",
    short: "Consegna",
  },
  {
    key: "rendicontazione",
    title: "Rendicontazione ed Impatto ESG",
    text: "L'azienda ottiene la certificazione dell'impatto generato (CO₂ evitata, supporto a cultura e filiera locale) per il Bilancio di Sostenibilità.",
    short: "Impatto ESG",
  },
];

export const IMPACT_INTRO =
  "Attraverso il modello di calcolo dell'ecosistema, le aziende e i responsabili HR possono misurare con esattezza il valore generato dall'iniziativa per la comunità e la propria organizzazione:";

export const impactIndicators: ImpactIndicator[] = [
  {
    key: "co2",
    title: "Sostenibilità Ambientale e CO₂ Evitata",
    text: "Misurazione esatta dei chilometri e delle tonnellate di CO₂ risparmiate grazie alla consegna integrata delle merci.",
  },
  {
    key: "indotto",
    title: "Indotto Economico Territoriale",
    text: "Valutazione del valore generato per gli operatori dell'ospitalità, della ristorazione e del settore agroalimentare locale (moltiplicatore 2,5×).",
  },
  {
    key: "cultura",
    title: "Sostegno al Settore Culturale",
    text: "Tracciamento delle giornate lavorative retribuite per artisti e del numero di spettatori coinvolti negli eventi del territorio.",
  },
  {
    key: "esposizione",
    title: "Impatto ed Esposizione per le Imprese CSR Aderenti",
    text: "Reporting ESG avanzato sulle ricadute territoriali, affiancato da servizi di comunicazione dedicati curati dai promotori per un posizionamento di brand e ritorno d'immagine nettamente superiori alle sponsorizzazioni tradizionali.",
  },
];
