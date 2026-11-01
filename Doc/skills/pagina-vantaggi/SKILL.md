---
name: pagina-vantaggi-ecosistema
description: Costruisce la pagina pubblica "I vantaggi della partecipazione" dell'ecosistema RADICI (welfare aziendale + vending smart + filiera fresca Km 0 + promozione culturale). Usa questa skill quando devi spiegare a imprese CSR, direttori HR, dipendenti, produttori locali e operatori culturali perché conviene aderire al progetto, e devi produrre una pagina Next.js coerente con il design system RADICI, con numeri presi dal database e non inventati.
---

# SKILL — Pagina "I vantaggi della partecipazione"

Questa skill descrive **come costruire la pagina esplicativa dei vantaggi** dell'ecosistema
*RADICI — Ecosistema d'Impatto e Welfare Territoriale Integrato*.

Non è un documento di marketing: è un **contratto di implementazione**. Contiene il copy
autoritativo (da non riscrivere), l'architettura della pagina, le regole sui dati, il design
system e i criteri di accettazione.

## 0. Stato dell'implementazione

La pagina esiste già: usare questa sezione per **estendere** senza riscrivere.

| Artefatto | Percorso |
| :--- | :--- |
| Pagina | `src/app/vantaggi/page.tsx` |
| Copy | `src/content/vantaggi.ts` |
| Claim di modello | `src/content/vantaggi-claims.ts` |
| Pannello con sfondo sfocato | `src/components/vantaggi/panel.tsx` (`BlurredPanel`) |
| Diagramma del processo | `StepsDiagram` in `src/components/duna-diagrams.tsx` (accetta `steps`, `tone`) |
| Sfondi pittorici sfocati | `public/images/vantaggi-{hero,stakeholder,moduli,impatto}.jpg` + `abstract-blur.jpg` |
| Link entrata | **menu desktop e mobile «Valore Condiviso»** (tra Imprese e Come funziona), footer «I vantaggi della partecipazione», pulsante in home |

**Trattamento visivo delle sezioni immagine** (richiesta esplicita del committente): l'immagine è
uno sfondo pittorico *volutamente sfocato* — è lo stesso linguaggio del diagramma in
`/come-funziona` — e il testo, le card e i diagrammi stanno **sopra l'immagine**, non accanto.
Tecnica: `BlurredPanel` con `img` in `absolute inset-0 object-cover` e contenuto in un layer
`relative`.

**Regola anti-cache (lezione pagata).** Il velo chiaro che garantisce il contrasto è **cotto dentro
il JPEG**, non affidato a un overlay CSS. Motivo: le classi nuove (`bg-cream/45`, `bg-paper/85`,
`backdrop-blur-sm`, `sr-only`…) compaiono solo nel CSS rigenerato; un visitatore che ha in cache il
CSS precedente le perde e si ritrova card trasparenti e testo illeggibile sullo sfondo. Quindi:

- superfici delle card: `bg-white` + `border-forest/10` (classi già presenti ovunque nel progetto);
- sfondi: JPEG sfocato **+ velo `#f4f1ea` al 40-55%** applicato in post-produzione;
- niente `sr-only` decorativi: se un'etichetta non deve vedersi, non renderizzarla.

Non introdurre vignette scure: gli sfondi sono chiari, il testo che ci va sopra è `text-forest`
opaco (non `/80`).

Ricetta completa di uno sfondo:

```bash
convert orig.jpg -resize 1600x -gaussian-blur 0x13 -modulate 103,108,100 \
  -fill "#f4f1ea" -colorize 42% -quality 88 public/images/vantaggi-<sezione>.jpg
```

Il terzo passaggio (`-colorize 42%`) è quello che rende il testo leggibile senza CSS.

**Screenshot di verifica.** L'ambiente non ha browser: si usa Chromium impacchettato su npm, con le
librerie e i font estratti dai bundle del pacchetto.

```bash
mkdir -p /tmp/shot && cd /tmp/shot && npm i @sparticuz/chromium puppeteer-core
node -e "const fs=require('fs'),z=require('zlib');for(const f of ['al2023','fonts']){try{fs.writeFileSync('/tmp/'+f+'.tar', z.brotliDecompressSync(fs.readFileSync('node_modules/@sparticuz/chromium/bin/'+f+'.tar.br')))}catch(e){}}"
mkdir -p /tmp/chromium-libs /tmp/chromium-fonts && tar -xf /tmp/al2023.tar -C /tmp/chromium-libs && tar -xf /tmp/fonts.tar -C /tmp/chromium-fonts
# fontconfig per avere un serif (DejaVu) e il sans del progetto
printf '%s' '<fontconfig><dir>/usr/share/fonts</dir><dir>/tmp/chromium-fonts/fonts</dir><cachedir>/tmp/fontconf/cache</cachedir><alias><family>serif</family><prefer><family>DejaVu Serif</family></prefer></alias></fontconfig>' > /tmp/fontconf/fonts.conf
FONTCONFIG_PATH=/tmp/fontconf LD_LIBRARY_PATH=/tmp/chromium-libs/lib node shot.js http://localhost:3000/vantaggi out.png 1440 900
```

`@sparticuz/chromium` va importato come `mod.default ?? mod` (altrimenti `chromium.args is not
iterable`) e lanciato con `headless: "shell"`.

---

## 1. Quando attivare questa skill

Attivala quando la richiesta è una di queste:

- «crea la pagina dei vantaggi / perché aderire / benefits»
- «serve una pagina che spieghi alle imprese e ai dipendenti cosa ci guadagnano»
- «prepara una landing per i direttori HR o per i promotori»
- devi aggiungere una nuova sezione a una pagina vantaggi già esistente

**Non** attivarla per: la pagina `/come-funziona` (spiega il *processo operativo*),
le pagine di catalogo (`/destinazioni`, `/strutture`, `/esplora`) o le dashboard di ruolo.

---

## 2. Contratto di output

| Voce | Valore |
| :--- | :--- |
| Route | `/vantaggi` (pubblica, dentro `PublicShell`) |
| File pagina | `src/app/vantaggi/page.tsx` — solo rendering, nessun testo lungo inline |
| File contenuti | `src/content/vantaggi.ts` — copy editoriale tipizzato (fonte unica) |
| File costanti | `src/content/vantaggi-claims.ts` — numeri dichiarati (deducibilità, churn, moltiplicatore) con commento di provenienza |
| Componenti | `src/components/vantaggi/*.tsx` se una sezione supera ~80 righe |
| Nav | voce «Valore Condiviso» in `SiteHeader` (desktop) **e** in `header-menu.tsx` (mobile): sono due menu distinti, vanno aggiornati entrambi |
| CTA | 1 primaria («Richiedi una convenzione» → `/imprese`), 1 secondaria («Vedi come funziona» → `/come-funziona`), 1 terza («Prova la piattaforma» → `/login`) |

**Criterio di successo:** un direttore HR e un produttore locale capiscono, senza scorrere
altre pagine, *cosa ricevono*, *quanto costa* e *come si misura l'impatto*.

---

## 3. Copy autoritativo (fonte unica — non riscrivere)

Il testo che segue è la **versione approvata**. Puoi spezzarlo in titoli, card e tabelle, ma
non cambiare numeri, promesse né qualificatori. Se un passaggio non entra nel layout, si
accorcia la forma, mai il contenuto.

### 3.1 Posizionamento (hero)

> **Ecosistema d'Impatto e Welfare Territoriale Integrato**
> La prima soluzione unificata che integra **Welfare Aziendale**, **Distribuzione Automatica
> Smart**, **Filiera Fresca Km 0** e **Promozione Culturale del Territorio**.

### 3.2 Sezione 1 — Il valore dell'ecosistema per gli stakeholder e la comunità

Testo di raccordo:

> I tradizionali servizi di ristoro da ufficio e benefit aziendali vengono trasformati in una
> rete integrata ad alto impatto. Unendo la flessibilità del **Welfare Aziendale**, la qualità
> del **Vending Smart**, la sostenibilità della **Filiera Km 0** e il sostegno al **Settore
> Culturale Locale**, generiamo valore condiviso per tutti gli attori coinvolti.

Quattro card (una per stakeholder):

| Stakeholder | Vantaggio |
| :--- | :--- |
| **Imprese e Direttori HR** | Piattaforma integrata a costo zero sul capitale, deducibilità fiscale al 100%, retention dipendenti e reportistica ESG avanzata per i capitolati di gara, affiancati da servizi di comunicazione dedicati e un posizionamento d'immagine superiore alle sponsorizzazioni tradizionali. |
| **Dipendenti e Collaboratori** | Voucher per hotel e ristorazione, spesa di prodotti freschi Km 0 consegnata direttamente sul posto di lavoro e biglietti omaggio per eventi culturali. |
| **Produttori Locali a Km 0** | Accesso a una rete di migliaia di lavoratori con logistica integrata a zero emissioni aggiuntive e azzeramento dei costi di trasporto. |
| **Teatri e Operatori dello Spettacolo** | Finanziamento diretto delle produzioni culturali tramite Matching Grant e ampliamento del pubblico sul territorio. |

### 3.3 Sezione 2 — I tre moduli operativi

1. **Piattaforma Welfare e Ingegneria dei Voucher**
   I budget CSR e welfare allocati dalle aziende vengono trasformati in voucher utilizzabili dai
   dipendenti per soggiorni in hotel/agriturismi (50 €) ed esperienze gastronomiche tipiche (25 €),
   garantendo flessibilità e totale deducibilità fiscale.
2. **Spesa Fresca Km 0 e Logistica a Zero Emissioni**
   I lavoratori ordinano panieri di prodotti locali via piattaforma web. La consegna avviene
   sfruttando i furgoni già impiegati per i giri di ricarica dei distributori, eliminando i mezzi
   extra su strada e abbattendo le emissioni di CO₂.
3. **Matching Grant per Spettacoli e Ospitalità Territoriale**
   Grazie alla copertura dei biglietti d'ingresso per eventi culturali tramite Matching Grant, ogni
   dipendente può accedere a weekend esperienziali completi senza costi vivi proibitivi, innescando
   una ricaduta economica positiva moltiplicata sul territorio.

### 3.4 Sezione 3 — Matrice dei benefici per i destinatari finali

Tabella a 4 colonne, **4 righe** (su mobile si trasforma in card impilate, mai in scroll orizzontale):

| Destinatario finale | Esigenza / obiettivo | Soluzione offerta dall'ecosistema | Vantaggio diretto e impatto generato |
| :--- | :--- | :--- | :--- |
| **Imprese e Direttori HR** | Retention del personale, benefici fiscali, reputazione ESG e forte posizionamento d'immagine extra-aziendale | Conversione budget CSR in welfare territoriale, reporting avanzato e servizi di comunicazione dedicati dai promotori | Deducibilità 100%, riduzione del churn (−80%), dossier CO₂ certificato, engagement dei dipendenti e ritorni di immagine imparagonabili rispetto alle tradizionali sponsorizzazioni. |
| **Dipendenti e Collaboratori** | Power welfare utile, conciliazione vita-lavoro e spesa di qualità | Voucher hotel/food, consegna prodotti Km 0 sul posto di lavoro e biglietti per spettacoli | Soggiorni a costi vivi azzerati, accesso diretto a cibo fresco locale e tempo libero di qualità con la famiglia. |
| **Produttori Locali Km 0** | Nuovi canali di vendita diretta senza costi di intermediazione o logistica | Consegna dei panieri tramite i furgoni del servizio di ristoro ordinario | Azzeramento spese di trasporto, accesso immediato a un bacino di migliaia di consumatori e valorizzazione del territorio. |
| **Teatri e Operatori Culturali** | Sostegno finanziario continuativo e ampliamento del pubblico in sala | Copertura finanziaria dei biglietti tramite Matching Grant e promozione congiunta | Retribuzione garantita per artisti e maestranze, fidelizzazione del pubblico e valorizzazione del patrimonio artistico. |

### 3.5 Sezione 4 — Il processo di coinvolgimento in 4 passaggi

1. **Attivazione convenzione welfare** — L'azienda definisce il budget deducibile CSR e abilita la
   piattaforma welfare integrata per i propri collaboratori.
2. **Scelta benefit e spesa in piattaforma** — I dipendenti ordinano i propri panieri di prodotti
   Km 0 o riscattano voucher per hotel e ristoranti tipici del territorio.
3. **Consegna e fruizione sul territorio** — I prodotti Km 0 arrivano direttamente in ufficio senza
   mezzi extra, mentre i biglietti omaggio attivano l'esperienza nel weekend.
4. **Rendicontazione e impatto ESG** — L'azienda ottiene la certificazione dell'impatto generato
   (CO₂ evitata, supporto a cultura e filiera locale) per il Bilancio di Sostenibilità.

### 3.6 Sezione 5 — Indicatori di impatto

Testo di raccordo:

> Attraverso il modello di calcolo dell'ecosistema, le aziende e i responsabili HR possono misurare
> con esattezza il valore generato dall'iniziativa per la comunità e la propria organizzazione.

Quattro indicatori:

| Indicatore | Descrizione |
| :--- | :--- |
| **Sostenibilità ambientale e CO₂ evitata** | Misurazione esatta dei chilometri e delle tonnellate di CO₂ risparmiate grazie alla consegna integrata delle merci. |
| **Indotto economico territoriale** | Valutazione del valore generato per gli operatori dell'ospitalità, della ristorazione e del settore agroalimentare locale (moltiplicatore 2,5×). |
| **Sostegno al settore culturale** | Tracciamento delle giornate lavorative retribuite per artisti e del numero di spettatori coinvolti negli eventi del territorio. |
| **Impatto ed esposizione per le imprese CSR aderenti** | Reporting ESG avanzato sulle ricadute territoriali, affiancato da servizi di comunicazione dedicati curati dai promotori per un posizionamento di brand e ritorno d'immagine nettamente superiori alle sponsorizzazioni tradizionali. |

---

## 4. Architettura della pagina (ordine obbligatorio)

1. **Hero** — eyebrow `Modello RADICI`, `<h1>` *Ecosistema d'Impatto e Welfare Territoriale
   Integrato*, sottotitolo di posizionamento, 2 CTA. Immagine a piena larghezza
   (`/images/hero.jpg`) con overlay scuro se il testo è sopra l'immagine.
2. **Fascia KPI** — 3 numeri **calcolati dal DB** (vedi §5): imprese aderenti, strutture
   convenzionate, welfare stanziato. Stile identico alla fascia statistiche della home.
3. **Valore per gli stakeholder** — griglia 2×2 (desktop) / 1 colonna (mobile), card con icona,
   titolo stakeholder e beneficio.
4. **Moduli operativi** — 3 colonne, numerate `01/02/03`, ognuna con un micro-dato in evidenza
   (50 €, 25 €, Km 0, CO₂).
5. **Matrice dei benefici** — tabella semantica su desktop (`<table>`), card su mobile.
6. **Processo in 4 passaggi** — timeline verticale con numeri grandi in `font-serif`.
7. **Indicatori di impatto** — 4 card su fondo `bg-mist/70`, con il moltiplicatore 2,5× isolato
   come numero grande.
8. **CTA finale** — banda `bg-forest` con testo `text-cream` e i due link principali.

**Sopra la piega** devono stare: h1, promessa in una riga (cosa, per chi, a che costo) e CTA primaria.

---

## 5. Regole sui dati (vincolanti)

1. **Nessun numero hardcoded nei componenti.** I valori che descrivono il sistema reale si leggono
   da `src/lib/data.ts`:
   - `getPlatformStats()` → `companies`, `venues`, `fundedCents`, `redistributedCents`,
     `impactPoints`, `transactions`;
   - `getVenues()` → per contare produttori (`type === "producer"`), teatri (`theater`),
     hotel/agriturismi (`hotel` + `agriturismo`) e ristoranti (`restaurant`);
   - `formatEuro(cents)` e `venueTypeLabel(type)` da `src/lib/utils.ts` per la formattazione.
2. **Fattore CO₂:** usa la costante già esistente `CO2_KG_PER_KM = 0.3` da
   `src/lib/local-producers.ts`. Non reintrodurre il valore a mano.
3. **Numeri dichiarati** (non presenti nel DB: deducibilità 100%, churn −80%, moltiplicatore 2,5×,
   voucher 50 € / 25 €) vivono **solo** in `src/content/vantaggi-claims.ts`, ognuno con un commento
   che spiega da dove viene e che è un'assunzione di modello, non una misurazione puntuale. In pagina
   vanno resi come claim con etichetta («dato di modello») dove il rischio di ambiguità è alto.
4. **Niente nuove tabelle o seed** per questa pagina: il contenuto editoriale è statico e vive in
   `src/content/`. Il DB serve solo per i KPI.
5. Se un KPI calcolato risulta `0` in ambiente demo, **non** nascondere la sezione: mostra il numero
   reale (0) e lascia i claim editoriali separati.

---

## 6. Design system (usare i token esistenti, zero dipendenze nuove)

Token in `src/app/globals.css` (`@theme`):

| Token | Hex | Uso |
| :--- | :--- | :--- |
| `forest` | `#22251f` | testo primario, banda CTA |
| `forest-deep` | `#171914` | hero scura |
| `cream` | `#f4f1ea` | fondo pagina |
| `paper` | `#f7f5f0` | card su fondo cream |
| `olive` | `#6e746c` | testi secondari |
| `gold` | `#b7a27a` | accenti, numeri, eyebrow |
| `wine` | `#8b5e52` | accento culturale |
| `mist` | `#ebe7de` | fasce e card secondarie |

Regole:

- Titoli in `font-serif`, corpo in sans di default; `<h1>` `text-4xl md:text-5xl leading-tight`.
- Eyebrow: `text-[11px] uppercase tracking-[0.18em] text-olive`.
- Card: `rounded-2xl` (o `rounded-[28px]` per i blocchi hero), `bg-white` o `bg-paper`, nessuna ombra
  pesante, bordi solo `border-forest/8`.
- Contenitore: `mx-auto max-w-5xl px-4 md:px-6` (o `max-w-6xl` per le griglie a 3 colonne).
- Spaziatura verticale tra sezioni: `py-16 md:py-24`.
- Link interni: **sempre** con `pathWithSession(path, token)` (`@/lib/session-cookie`), come fa
  `SiteHeader`; mai `href="/..."` nudo se serve mantenere la sessione.
- Il menu desktop ha **6 voci** e si vede da `md` (≥768 px): sotto `lg` usa etichette compatte
  («Strutture» invece di «Strutture e Tipicità KM 0»), gap 16 px e testo 12 px; da `lg` torna
  l'etichetta completa, gap 24 px e testo 13 px. Nav e pulsante account/hamburger condividono la
  soglia `md`, altrimenti tra 768 e 1023 px la barra sparisce e resta solo l'hamburger.
  Se aggiungi una settima voce, rimisura: a 768 px il contenuto deve restare entro 736 px.
- Avatar/immagini: `<img>` semplice (il progetto non usa `next/image`); se sostituisci un file JPG
  già referenziato **aggiungi `?v=N`** al percorso, altrimenti browser e proxy continuano a servire
  la versione vecchia.
- Icone: `lucide-react` (già in dipendenze). Nessuna nuova libreria.

---

## 7. Tono e regole di copy

- Lingua: italiano. Tono: concreto, da documento di business, non da pubblicità.
- Dare del **tu** al visitatore solo nelle CTA; nel corpo usare la forma impersonale o «l'azienda».
- Valuta: `50 €`, sempre con spazio; numeri decimali con virgola quando in prosa (2,5×).
- CO₂ sempre con il pedice Unicode; Km 0 con la maiuscola sola sulla K (non «KM 0», non «km0»),
  tranne quando il token è dentro un nome proprio già esistente (es. `/strutture` intitolata
  «Strutture e Tipicità KM 0»): non toccare i titoli già in produzione.
- Non usare parole vietate dal posizionamento: «fee», «commissione» solo in negativo
  («nessuna commissione per la piattaforma»), mai come costo a carico dell'impresa.
- Ogni card deve avere un verbo: cosa *ottiene* il lettore, non cosa *è* la funzione.

---

## 8. Procedura operativa

1. **Leggi il contesto**: `src/app/page.tsx` (fascia statistiche), `src/app/come-funziona/page.tsx`
   (struttura `PublicShell` + lista numerata), `src/app/strutture/page.tsx` (sezioni per tipo).
2. **Crea `src/content/vantaggi.ts`** con tipi espliciti:
   `stakeholders`, `modules`, `benefitMatrix`, `processSteps`, `impactIndicators`.
3. **Crea `src/content/vantaggi-claims.ts`** per i numeri dichiarati, ciascuno commentato.
4. **Realizza `src/app/vantaggi/page.tsx`**: server component `async`, `export const metadata`
   (title `I vantaggi della partecipazione | RADICI`, description ≤ 160 caratteri), lettura KPI via
   `getPlatformStats()`.
5. **Collega la pagina**: link dal footer e dalla home (sezione finale), CTA verso `/imprese`,
   `/come-funziona`, `/login`. Evita di aggiungere un'ennesima voce di menu se `SiteHeader` è già
   a 5 voci su desktop: valuta il gruppo «Chi siamo / Modello».
6. **Verifica tipi**: `npm run typecheck` e filtra gli eventuali errori spuri `.next/`.
7. **Verifica HTML servito** (il DB demo parte con i dati di seed):

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/vantaggi
   curl -s http://localhost:3000/vantaggi | grep -c "Ecosistema d"                  # 1 h1
   curl -s http://localhost:3000/vantaggi | grep -o "<h2[^>]*>[^<]*</h2>"          # 5 sezioni
   curl -s http://localhost:3000/vantaggi | grep -c "Matching Grant"                 # > 0
   curl -s http://localhost:3000/vantaggi | grep -oc "2,5"                           # moltiplicatore
   ```

8. **Verifica visiva** a 390 px e 1440 px: nessun overflow orizzontale, tabella leggibile,
   CTA raggiungibili col pollice.
9. **Commit** con messaggio `feat(vantaggi): pagina dei vantaggi della partecipazione ...`
   sul solo branch di sessione.

---

## 9. Accessibilità, SEO, performance

- Un solo `<h1>`; gerarchia `h2` per sezione, `h3` per card. Mai saltare livelli.
- La matrice benefici è un `<table>` reale con `<th scope="col">` su desktop e `<dl>`/card su mobile
  (doppio markup accettato solo con `hidden md:block` / `md:hidden`).
- Contrasto minimo 4.5:1: su `gold` non scrivere testo chiaro; su `forest` solo `cream`.
- `alt` descrittivo per le immagini di contenuto, `alt=""` per le decorative.
- Nessuna animazione che parta da sola; se aggiungi hover/transizioni, rispetta
  `prefers-reduced-motion` (il CSS globale non lo forza).
- La pagina deve essere **server-rendered**: niente `useEffect` per i KPI, nessun `fetch` client-side.
- Nessuna immagine nuova oltre a quelle già in `public/images/`; se ne serve una, va generata nello
  stile pittorico del progetto e committata con percorso versionato (`?v=1`).

---

## 10. Divieti (errori già pagati in questo progetto)

- ❌ Rompere l'architettura `?sid=` o i redirect per ruolo: la pagina è pubblica ma i link devono
  preservare la sessione quando esiste.
- ❌ Duplicare voci di navigazione o creare due tab con lo stesso scopo (bug già occorso).
- ❌ Mettere array di contenuto dentro il `page.tsx`: il copy va in `src/content/`.
- ❌ Inventare numeri di impatto (posti, spettatori, tonnellate) non presenti nel DB o nei claim.
- ❌ Introdurre `next/image`, librerie di icone o font aggiuntivi.
- ❌ Sostituire un'immagine mantenendo lo stesso URL (cache): usare `?v=N`.
- ❌ Darsi per soddisfatti dopo un `edit_file`: verificare con `grep` che la modifica sia nel file
  (gli snapshot dell'ambiente possono perdere le edit in modo silenzioso).

---

## 11. Definition of Done

- [ ] `/vantaggi` risponde 200 e contiene hero, 5 sezioni, CTA finale.
- [ ] Tutti i testi di §3 sono presenti integralmente (matrice a 4 righe, processo a 4 passaggi,
      4 indicatori, 3 moduli).
- [ ] I KPI derivano da `getPlatformStats()` / `getVenues()`; zero numeri di sistema hardcoded.
- [ ] I claim dichiarati (100%, −80%, 2,5×, 50 €, 25 €) stanno solo in `vantaggi-claims.ts`.
- [ ] `npm run typecheck` pulito (esclusi errori spuri `.next/`).
- [ ] Nessun overflow orizzontale a 390 px; tabella leggibile a 1440 px.
- [ ] Link interni con `pathWithSession`; nessuna voce di nav duplicata.
- [ ] `metadata` dedicati; un solo `<h1>`.
- [ ] Commit e push sul branch `arena/98854b50-corporate-welfare-platform-1`.

---

## 12. Skeleton di riferimento

```tsx
// src/app/vantaggi/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
import { getPlatformStats } from "@/lib/data";
import { formatEuro } from "@/lib/utils";
import { stakeholders, modules, benefitMatrix, processSteps, impactIndicators } from "@/content/vantaggi";

export const metadata: Metadata = {
  title: "I vantaggi della partecipazione | RADICI",
  description:
    "Welfare aziendale, vending smart, filiera fresca Km 0 e promozione culturale: cosa ottengono imprese, dipendenti, produttori e teatri.",
};

export default async function VantaggiPage() {
  const stats = await getPlatformStats();

  return (
    <PublicShell>
      <section className="bg-forest-deep px-4 py-20 text-cream md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Modello RADICI</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
            Ecosistema d&apos;Impatto e Welfare Territoriale Integrato
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-cream/80">
            La prima soluzione unificata che integra Welfare Aziendale, Distribuzione Automatica
            Smart, Filiera Fresca Km 0 e Promozione Culturale del Territorio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/imprese" className="rounded-full bg-gold px-6 py-3 text-sm text-forest-deep">
              Richiedi una convenzione
            </Link>
            <Link href="/come-funziona" className="rounded-full border border-cream/30 px-6 py-3 text-sm">
              Vedi come funziona
            </Link>
          </div>
        </div>
      </section>

      {/* … fascia KPI con stats.companies / stats.venues / formatEuro(stats.fundedCents),
             sezioni 3.2 → 3.6, CTA finale … */}
    </PublicShell>
  );
}
```

```ts
// src/content/vantaggi.ts — estratto
export type StakeholderBenefit = { key: string; label: string; benefit: string };
export const stakeholders: StakeholderBenefit[] = [
  { key: "imprese", label: "Imprese e Direttori HR", benefit: "Piattaforma integrata a costo zero sul capitale, deducibilità fiscale al 100%…" },
  // …
];
```

---

## 13. Varianti richiedibili dal committente

| Variante | Cosa cambia |
| :--- | :--- |
| **Versione breve per gare** | Stesse sezioni, matrice ridotta a vantaggi + numeri, scaricabile come PDF (`jspdf` è già in dipendenze). |
| **Versione per promotori** | Enfasi su fondo Matching Grant, convenzioni con i teatri e servizi di comunicazione. |
| **Versione per produttori** | Enfasi su logistica integrata, KM 0 e assenza di costi di trasporto; CTA verso `/registrati` con `role=producer`. |
| **Versione EN** | Solo se esiste già un impianto i18n: al momento il progetto è mono-lingua (`lang="it"` in `layout.tsx`), quindi non introdurre framework di traduzione. |
