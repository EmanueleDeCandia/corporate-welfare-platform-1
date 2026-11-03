---
name: innovation-review
description: Revisione di innovazione della DEMO RADICI, versione 2 (include le regole di business confermate dal committente). Contiene la diagnosi di struttura, design, funzionalità e business rule e un backlog aggressivo di funzioni ad alto impatto, tutte realizzabili in modalità DEMO (dati seed, SQLite, nessun requisito normativo, SMTP o di pagamento). Usa questa skill per pianificare o implementare simulatore di impatto, torneo dei trailer, ticket studio, enti pubblici, riallocazione voucher e per verificare che una proposta rispetti i vincoli della DEMO.
---

# SKILL — Revisione di Innovazione e Backlog Funzionale (RADICI DEMO) v2

Redatta in veste di revisore di innovazione. Oggetto: struttura, design, funzionalità e business rule di `/business-model` (fonte: `Doc/note_esplicative_business_model.md`). Questa versione recepisce le correzioni e le regole dettate dal committente e rende la roadmap più ambiziosa, organizzata in tracce parallele.

## 0. Vincoli non negoziabili della DEMO

1. RADICI è e resta una DEMO funzionante. Ogni funzione deve essere dimostrabile in pochi minuti con i dati del seed.
2. Nessun requisito normativo (fiscalità, fatturazione elettronica, privacy avanzata, appalti reali, controlli antifrode reali).
3. Nessun requisito SMTP o di pagamento. Le comunicazioni sono simulate in-app oppure delegate al dispositivo dell'utente (link `mailto:`, `wa.me`, Web Share API, intent di condivisione social): nessun invio dal server, nessuna chiave API.
4. Nessun dato pseudo casuale. Ogni numero mostrato deriva dai dati del seed o da input espliciti dell'utente. Un simulatore con gli stessi input produce sempre gli stessi output.
5. Persistenza SQLite effimera (vedi `Doc/skills/deploy-cloud-run/SKILL.md`). Ogni funzione deve funzionare dopo «Ripristina Dati Demo (Tutti)»: dati nuovi nel seed (`src/db/seed.ts`), pulizia nel reset (`/api/vouchers/reset-demo`). Il primo impatto del visitatore non deve contenere notifiche improprie.
6. Modifiche solo additive a schema, API e business rule.
7. Separazione netta tra il branch `restart-open-architecture-design` e il ramo Cloud Run storico (`production/cloudrun-demo`, `radici-cloudrun`): non importare nulla da quest'ultimo.
8. Testi in italiano, tono manageriale, nessuna parola in grassetto nei testi del modello di business, spazio dopo i due punti.
9. Design: riuso del design system (`src/components/design-system`, palette forest, terracotta, cream, gold, icone `lucide-react`, niente emoji nei form).
10. Servizio Cloud Run di riferimento: `welfare-impact`, progetto `my-project-first-330911`, regione `europe-west1`.

## 1. Business rule confermate dal committente (fonte di verità per l'implementazione)

R1. Ogni Voucher Pernottamento e ogni Voucher Aperitivo-Cena è collegato e vincolato a un Evento di Performing Art. Un addetto ha un solo Voucher, quindi un solo spettacolo.

R2. Il Voucher Pernottamento vale per una persona, ma circa il 90% dei pernottamenti è in due. La percentuale è un input variabile del simulatore, con 90% come valore predefinito.

R3. Matching Grant. Valore 50 euro per due persone, 25 euro se usato da una persona sola.
- Costo per la Startup: massimo 15 euro a persona, a copertura del biglietto di teatro.
- I restanti 10 euro a persona sono un buono per servizi erogati direttamente dalla Startup (incontro con gli artisti in hotel o agriturismo, spettacolo ancillare il giorno dopo il pernottamento). Non è un esborso ma una rinuncia a ricavi propri (costo opportunità).
- Costo di cassa per grant: 15 euro (una persona) oppure 30 euro (due persone). Costo opportunità: 10 oppure 20 euro.

R4. Percentuali di convenzione. Le percentuali (10% è solo indicativo) vanno trattate come intervallo 10%-30% per ogni accordo. La Startup porta clienti all'hotel in modo ricorrente tramite gli spettacoli e offre sistema di prenotazione e servizi di marketing oltre il singolo evento e il riscatto del voucher. Il valore percepito è quindi superiore a quello di una commissione di sola intermediazione di una agenzia online generalista.

R5. Riallocazione voucher inutilizzati. Un mese prima della data di uno spettacolo o evento locale (data fissata con i teatri e collegata al Matching Grant), se resta inutilizzato il 20% dei voucher di un tipo (Pernottamento oppure Aperitivo-Cena), l'impresa CSR può assegnare i voucher residui ad altri addetti che hanno già utilizzato il proprio voucher. Il vincolo: la riallocazione non può superare il 20% per ciascun tipo di voucher.

R6. Torneo dei Trailer (premi della Startup, distinti dal Matching Grant).
- Gli addetti delle diverse imprese CSR votano i trailer di 20 secondi degli spettacoli in gara.
- Gli spettacoli in gara sono almeno 2.
- L'impresa che ha contribuito con più voti allo spettacolo vincitore riceve 10 biglietti omaggio.
- Le prime 10 imprese per voti allo spettacolo vincitore ricevono 2 biglietti omaggio ciascuna.
- I biglietti omaggio non sono legati a pernottamento o cena: servono a riportare in gioco anche gli addetti che non hanno più alcun voucher.

R7. Enti pubblici. Un'azienda pubblica ha un account senza possibilità di sponsorizzazione. Per questo la funzione di visibilità dedicata è il Ticket Studio (F-05).

R8. Amici invitati che si iscrivono tramite referral sono conteggiati come addetti dell'impresa CSR dell'invitante, ai fini del torneo.

### 1.1 Ipotesi interpretative da confermare (valori predefiniti modificabili)

1. R5: il tetto del 20% è calcolato per tipo di voucher e per evento. Il trigger e il tetto usano la stessa percentuale, resa parametro.
2. R6: la prima impresa riceve 10 biglietti e non cumula i 2 del gruppo delle prime 10 (non cumulativo come predefinito). Costo massimo teorico per torneo: (10 + 9 × 2) × 15 = 420 euro con biglietto a 15 euro.
3. R6: un account esprime un voto per spettacolo in gara. I biglietti vinti sono assegnati all'impresa; la distribuzione ai singoli addetti avviene dall'area impresa con priorità suggerita agli addetti senza voucher attivo.
4. R3: costo massimo del biglietto di teatro pari a 15 euro è un parametro del simulatore, non una costante.

## 2. Diagnosi

### 2.1 Punti di forza da preservare

- Tesi industriale non banale: welfare come leva di coesione per borghi e aree interne.
- Ecosistema già modellato: promotore, impresa CSR, fornitore, teatro, dipendente, amico (`vouchers`, `matching_grants`, `grant_seats`, `invites`, `shares`, `certificates`, `transactions`).
- Plafond di 75 euro tarato sull'approvazione dei CdA e leva del Matching Grant verso la camera doppia.
- Control Room Promotori e Dashboard Impresa CSR già distinte, referral già attivo (`/r/[code]`).
- Reset demo e architettura effimera.

### 2.2 Potenzialità inespresse

| Area | Osservazione | Potenziale |
| :--- | :--- | :--- |
| Business rule | I parametri economici sono nei testi e in costanti sparse, non manipolabili né collegati. | Simulatore di impatto con input plausibili, il vero strumento di vendita. |
| Business rule | Costo del grant, margine ristorazione e commissioni convenzione non sono mai messi a confronto in demo. | Indicatore di sostenibilità con costo di cassa e costo opportunità separati (R3). |
| Funnel | Un addetto ha un solo voucher e dopo averlo usato esce dal gioco. | Torneo dei trailer: ingaggio pre conversione, anche per chi non ha voucher (R6). |
| Diffusione | Referral e condivisioni esistono ma non sono legati a un obiettivo comune. | Voto, invito e condivisione social con vantaggio competitivo per la propria impresa (R6, R8). |
| Enti pubblici | Nessuna distinzione di tipo ente e nessuno strumento di visibilità senza sponsorizzazione. | Ticket Studio: biglietto d'autore condivisibile, con valorizzazione locale (R7). |
| Prodotto | Il volano spettacolo, pernottamento, cena è raccontato ma composto a mano. | Compositore di Mini-Vacanza. |
| Operatività | Eventi e disponibilità delle strutture non dialogano. | Calendario di riempimento e riallocazione voucher a T-30 (R5). |
| Convenzione | Il valore per l'hotel non è visibile. | Scheda valore del partner con percentuale 10%-30% (R4). |
| Design | Nessuna regia narrativa della demo. | Modalità presentatore. |

### 2.3 Incongruenze e correzioni nelle business rule

1. Margine «circa 80%». Con prezzo 25 euro e costo materie prime 5-7 euro il margine lordo è 72%-80% (18-20 euro). Con cessione agevolata fino a 10 euro scende al 60% (15 euro). Il simulatore mostra sempre l'intervallo e lo scenario scelto.
2. Costo del Matching Grant. Correzione rispetto alla v1: il costo di cassa non è 50 euro ma 15 euro a persona (30 per due), più 10 euro a persona di rinuncia ricavi (R3). Una sola cena (margine 15-20 euro) copre quindi il costo di cassa di un grant singolo e circa metà o due terzi di un grant doppio. Il rapporto di copertura va calcolato in simulatore e in Control Room, distinguendo cassa e costo opportunità.
3. Commissione sulle camere. Non è un semplice benchmark: è un parametro di convenzione tra 10% e 30% (R4). Nessuna schermata deve presentare il 10% come valore unico.
4. Cesto omaggio ogni 10. Modellistico. Va etichettato come tale nelle schermate del produttore.
5. Documentazione. Allineata la skill di deploy e `Doc/deploy-cloud-run.md` al servizio `welfare-impact` (fatto).
6. Il costo massimo del torneo (420 euro per edizione con le ipotesi di 1.1) è trascurabile rispetto al costo Startup 30.000-100.000 euro: è un argomento da mostrare.

## 3. Backlog funzionale

Effort: S (fino a 1 giorno), M (2-3 giorni), L (4-6 giorni). Per ogni scheda: valore, descrizione, dove, dati, accettazione.

### Ondata 1 — Motore economico, viralità e enti pubblici

Tracce parallele: A economia (F-01, F-02, F-03), B engagement (F-06, F-07), C enti pubblici (F-04, F-05).

#### F-01 Simulatore di Impatto del Circuito

- Valore: trasforma `/business-model` da documento a strumento deterministico, verificabile dal vivo. Sostituisce l'idea precedente di generare dati simulati: nessun dato pseudo casuale, solo input e formule dichiarate.
- Input (tutti modificabili, con valori predefiniti coerenti con la matrice parametri):
  - Rete: imprese aderenti, addetti per impresa (totale addetti).
  - Conversione voucher: addetti che convertono il Voucher Pernottamento e addetti che convertono il Voucher Aperitivo-Cena (due percentuali distinte).
  - Pernottamenti in due: percentuale di pernottamenti con persona invitata (predefinito 90%, regola R2).
  - Km 0: percentuale di addetti e amici che acquistano prodotti Km 0 consegnati in sede, numero di acquisti per conversione, valore medio per acquisto (ricavi prodotti Km 0), distanza media delle spedizioni.
  - Ambiente: CO2 evitata per spedizioni in sede con la flotta Illiria, distanza di consegna da 30 a 70 km, fattore emissivo per km (parametro modificabile).
  - Valori: valore dei voucher (50 e 25 euro), valore del Matching Grant (25 euro a persona), costo massimo biglietto teatro (15 euro).
  - Referral: tasso di referral (inviti per addetto) e percentuale di conversione da referral.
  - Domanda e ricavi dei partner: numero di pernottamenti hotel, numero di Aperitivi-Cena, ricavi hotel, ricavi Aperitivi-Cena e ristoranti.
  - Margini: percentuale di margine o commissione per ogni partner (hotel, ristoranti, produttori, teatri) con intervallo 10%-30% (R4), margine percentuale della Startup sulla ristorazione (60%-80% secondo lo scenario materie prime).
  - Capacità: numero di presenze locali, cioè posti letto disponibili per ogni spettacolo, con controllo di saturazione (richiesta contro disponibilità).
  - Torneo: biglietti omaggio erogati per edizione (default 28), numero di edizioni annue.
  - Struttura costi: costo Startup annuo selezionabile da 30.000 a 100.000 euro.
  - Moltiplicatore economico locale (predefinito 5,1x).
- Output (impatto e sostenibilità economica):
  - Impatto: welfare finanziato, euro ridistribuiti sul territorio, quota verso produttori, notti e cene generate, persone ospitate, presenze a teatro, km evitati e CO2 evitata.
  - Sostenibilità: ricavi e margine Startup per voce (ristorazione, commissioni di convenzione, Km 0), costo di cassa del Matching Grant, costo opportunità dei buoni servizi, costo del torneo, rapporto di copertura del grant, risultato netto contro costo Startup, punto di pareggio (addetti o cene necessari), mese di pareggio.
  - Vincoli: semaforo di saturazione dei posti letto per spettacolo, avviso se il tasso di conversione supera la capacità.
- Dove: sezione interattiva in `src/app/business-model/page.tsx` (componente client), funzioni pure in `src/lib/economics.ts` (oggetto `ECONOMIC_PARAMS` unico), riusate da `src/lib/promoters.ts` perché la Control Room e il simulatore mostrino numeri coerenti.
- Dati: nessuna tabella. Stato in URL (parametri di query) per condividere uno scenario.
- Accettazione: con i valori predefiniti riproduce i numeri attuali della matrice; pulsante «Ripristina»; gli output sono identici a parità di input; ogni formula è consultabile in una nota esplicativa; dicitura «stima dimostrativa».
- Effort: L.

#### F-02 Scheda di Sostenibilità della Startup nella Control Room

- Valore: risponde alla domanda «chi paga il grant?» con numeri reali del seed.
- Descrizione: in `/promotori` mostra margine ristorazione cumulato, costo di cassa del Matching Grant (15 euro a persona), costo opportunità (10 euro a persona), spesa dei biglietti omaggio del torneo, rapporto di copertura e semaforo (sotto 100%, 100%-130%, oltre 130%). Selettore dello scenario materie prime (5, 7, 10 euro).
- Dove: `src/lib/promoters.ts`, `src/components/promoters-dashboard-view.tsx`.
- Dati: derivati da `transactions` e `matching_grants`.
- Accettazione: i totali coincidono con le transazioni visibili e si aggiornano dopo ogni riscatto o annullamento.
- Effort: S.

#### F-03 Scenari Salvati e Confronto

- Valore: permette di raccontare tre futuri (prudente, base, ambizioso) in una sola schermata.
- Descrizione: tre scenari predefiniti più uno libero, tabella di confronto affiancata sugli output di F-01, grafico del mese di pareggio, link condivisibile.
- Dove: componente di confronto accanto al simulatore; scenari come dati in `src/lib/economics.ts`.
- Dati: nessuna tabella; scenari modificabili in sessione.
- Accettazione: gli scenari predefiniti sono documentati e riproducibili.
- Effort: S.

#### F-04 Tipologia Ente: Privato e Pubblico (priorità prima ondata)

- Valore: allinea la piattaforma alla Tesi (R7) e prepara F-05 e il racconto delle gare.
- Descrizione: campo `entityType` (`private` oppure `public`) nella creazione impresa del promotore. Per gli enti pubblici sono nascoste le funzioni di sponsorizzazione struttura, compare l'etichetta «Ente Pubblico» e il Ticket Studio è messo in evidenza nel profilo degli addetti.
- Dove: `src/db/schema.ts` (colonna additiva, default `private`), `src/app/api/promoters/companies/route.ts` e `[id]/route.ts`, modale impresa in `promoters-dashboard-view.tsx`, `company-dashboard-view.tsx`.
- Dati: seed con un ente pubblico dimostrativo (per esempio un Comune o una Unione di Comuni) con piano e referente, nel rispetto della scelta di non inserire aziende pubbliche nella demo: da confermare con il committente. In alternativa, creazione manuale dal promotore durante la presentazione.
- Accettazione: le imprese esistenti restano private; un ente pubblico non può avere `sponsoredVenueId`; il reset demo rimuove l'ente se creato in sessione.
- Effort: S.

#### F-05 Ticket Studio (Biglietto d'Autore Condivisibile)

- Valore: dà visibilità e diffusione agli enti pubblici che non possono sponsorizzare e a tutti gli addetti. È anche il motore di diffusione del torneo, perché ogni biglietto porta il link referral.
- Descrizione: mini applicazione nel profilo dell'addetto. Si sceglie evento, stile artistico e personalizzazione (nome, messaggio). Il biglietto contiene titolo, data, teatro, borgo, struttura ospitante, valorizzazione locale (euro ridistribuiti, filiera Km 0, CO2 evitata), codice QR verso la pagina dell'evento con il referral dell'addetto.
  - Stili: almeno sei, per esempio Liberty, Futurismo, Bauhaus, Manifesto teatrale anni cinquanta, Acquerello, Ceramica marchigiana.
  - Azioni: scarica (immagine), inoltra via email (apre il client di posta con oggetto, testo e link precompilati), pubblica sul profilo social (Web Share API e link di condivisione), inoltra con WhatsApp agli amici (link `wa.me`), copia link.
- Dove: nuova rotta `src/app/account/ticket-studio`, generazione immagine con `ImageResponse` di Next su `src/app/api/ticket-card/route.tsx` (stile, evento e nome in query), anteprima in tempo reale con componente client, stili come dati in `src/lib/ticket-styles.ts`; integrazione con `shares` per contare le condivisioni.
- Dati: tabella additiva `ticket_cards` (utente, evento, stile, data) e registrazione di ogni azione di condivisione in `shares`.
- Accettazione: il biglietto scaricato e quello condiviso sono identici; il link referral porta alla pagina evento e attribuisce l'iscrizione all'impresa dell'invitante (R8); nessun invio dal server.
- Effort: L.

#### F-06 Torneo dei Trailer (Gamification Pre Conversione)

- Valore: ingaggia gli addetti prima della conversione e riporta in gioco chi ha esaurito il voucher (R1). Trasforma il voto in competizione tra imprese, quindi in diffusione.
- Descrizione: edizioni a tempo con almeno 2 spettacoli in gara, ciascuno con trailer di 20 secondi. Ogni account esprime un voto per spettacolo in gara. I voti sono attribuiti all'impresa dell'addetto, inclusi quelli degli amici iscritti tramite referral (R8). Alla chiusura: lo spettacolo vincitore è quello con più voti totali. L'impresa con più voti allo spettacolo vincitore riceve 10 biglietti omaggio, le prime 10 imprese per voti allo spettacolo vincitore ricevono 2 biglietti omaggio ciascuna (R6, ipotesi non cumulativa).
  - Classifiche live: spettacoli, imprese (per spettacolo), con contatore dei voti da amici.
  - Assegnazione: l'area impresa mostra il pool di biglietti e consente all'HR di assegnarli agli addetti, con evidenza di chi non ha voucher attivo.
  - Chiusura simulata: pulsante del promotore «Chiudi edizione e assegna premi» (la demo non attende scadenze reali), che calcola e registra i premi.
  - Conversione a valle: chi riceve un biglietto omaggio vede subito la proposta di pernottamento con sconto community del 10% a proprio carico.
- Dove: nuova area `src/app/torneo` (pubblica per consultazione, voto da account addetto), gestione edizioni in `/promotori`, pool premi in `/azienda`, logica in `src/lib/tournament.ts`.
- Dati: tabelle additive `tournaments`, `trailers` (evento, durata, file o poster, spettacolo), `trailer_votes` (utente, trailer, impresa attribuita, origine referral), `free_tickets` (impresa, evento, quantità, origine torneo, assegnatario). Seed con un'edizione aperta, 2 spettacoli e voti dimostrativi coerenti con gli account demo (nessun dato casuale).
- Accettazione: un voto per account per spettacolo; il calcolo dei premi segue esattamente R6; la chiusura è ripetibile dopo il reset; i biglietti omaggio non consumano né alterano voucher e Matching Grant.
- Effort: L.

#### F-07 Vetrina Trailer, Referral e Diffusione

- Valore: dà una casa pubblica ai trailer e rende l'invito un meccanismo di voto, con effetto virale.
- Descrizione: componente di piattaforma che espone i trailer degli spettacoli. Da ogni scheda: vota con il proprio account addetto, invita amici (link referral esistente `/r/[code]`; gli amici che si iscrivono sono contati come addetti dell'impresa, R8), condividi sui social per dare rilevanza all'evento. Contatori visibili: voti, amici iscritti, condivisioni.
- Gamification con voto: punti impatto aggiuntivi (parametro) per voto espresso, per amico iscritto e per condivisione, con livelli collegati a `badgeLevel`.
- Dove: sezione in `/esplora` e pagina evento, riuso di `src/app/r/[code]/page.tsx`, `invites`, `shares`, `src/components/account-hub.tsx`.
- Dati: usa le tabelle di F-06 e quelle esistenti di referral.
- Accettazione: la registrazione tramite link referral attribuisce all'impresa dell'invitante; i punti non cambiano la formula esistente dei punti impatto, si sommano come voce distinta.
- Effort: M.

### Ondata 2 — Prodotto e regole operative

#### F-08 Passaporto dei Borghi (Gamification Post Conversione)

- Valore: complemento del torneo. Alimenta la ricorrenza dopo la conversione.
- Descrizione: timbro digitale per ogni borgo con presenza confermata, livelli `badgeLevel` collegati ai timbri, sfide stagionali con premio simbolico, classifica anonima per squadra aziendale visibile all'HR.
- Dove: `src/components/account-hub.tsx`, `src/lib/data.ts`.
- Dati: tabella additiva `passport_stamps`, alimentata solo da presenze confermate.
- Accettazione: nessun timbro senza presenza confermata.
- Effort: M.

#### F-09 Compositore di Mini-Vacanza

- Valore: il prodotto vero di RADICI: spettacolo, notte e cena in un solo percorso, che spinge la camera doppia.
- Descrizione: percorso guidato. Passo 1 spettacolo (rispetta R1: il voucher è già legato all'evento). Passo 2 strutture della zona con disponibilità. Passo 3 cena ed eventuale cesto Km 0. Riepilogo con plafond, Matching Grant (una o due persone) e quota a carico dell'ospite. Crea le prenotazioni con gli endpoint esistenti in un'unica operazione.
- Dove: `src/app/account/mini-vacanza`, riuso di `/api/vouchers/redeem`, `/api/bookings`, `/api/grants/*`, annullamenti da `welfare-cancellation.ts`.
- Dati: opzionale `trip_bundles`.
- Accettazione: stessi effetti contabili dei flussi manuali.
- Effort: L.

#### F-10 Calendario di Riempimento e Suggeritore di Eventi

- Valore: rende operativo il traino bidirezionale spettacoli e strutture.
- Descrizione: mappa di calore per borgo e settimana (occupazione contro capienza, posti a teatro), finestre di opportunità per eventi, pulsante «Proponi evento» che precompila il modulo eventi. Usa la capacità in posti letto (stesso input del simulatore).
- Dove: nuova tab in `/promotori`, calcoli in `src/lib/promoters.ts`.
- Dati: derivati da `venue_offerings`, `bookings`, `grant_events`.
- Accettazione: le finestre cambiano quando si crea un evento o una prenotazione.
- Effort: M.

#### F-11 Riallocazione dei Voucher a T-30 (Regola R5)

- Valore: aumenta l'utilizzo del plafond e la presenza in sala, con una regola semplice e dimostrabile.
- Descrizione: a un mese dalla data di ogni evento collegato a Matching Grant, per ciascun tipo di voucher (Pernottamento, Aperitivo-Cena) il sistema calcola la quota inutilizzata. Se almeno il 20% è inutilizzato, l'impresa CSR vede una finestra «Riallocazione» e può assegnare i voucher residui ad addetti che hanno già utilizzato il proprio voucher. Tetto: mai oltre il 20% per tipo di voucher e per evento. Il contatore mostra quota riallocabile, riallocata e residua.
  - Per la demo: selettore «data di riferimento» nella Control Room per spostare il giorno corrente e mostrare l'apertura della finestra senza attendere un mese.
- Dove: `src/lib/company.ts`, `/api/company/employees` (azione di riallocazione), vista in `company-dashboard-view.tsx`.
- Dati: `voucher_reassignments` (voucher, da, a, evento, tipo, data) e parametri `REALLOCATION_TRIGGER_PERCENT` e `REALLOCATION_CAP_PERCENT`, entrambi 20.
- Accettazione: finestra aperta solo da T-30 e con soglia raggiunta; impossibile superare il tetto; il destinatario riceve il voucher legato allo stesso evento; il totale del plafond aziendale non cresce; il reset ripristina lo stato.
- Effort: M.

#### F-12 Scheda Valore del Partner e Convenzione 10%-30%

- Valore: mostra a hotel e ristoranti perché la convenzione RADICI vale più di una commissione di sola intermediazione (R4).
- Descrizione: scheda per ogni struttura con percentuale di convenzione (selezionabile 10%-30%), clienti ricorrenti portati dagli spettacoli, nuove notti nei giorni deboli, presenze generate da referral e dal torneo, uso del sistema di prenotazione, servizi di marketing ricevuti (vetrina, trailer, ticket card). Confronto sintetico con una commissione di intermediazione generalista a parità di percentuale, con la dicitura «stima dimostrativa».
- Dove: `provider-panel.tsx` per il fornitore, `/promotori` per il confronto tra partner, calcoli in `src/lib/economics.ts`.
- Dati: colonna additiva `venues.conventionPercent` (default 10); nessun uso come ricavo certificato.
- Accettazione: la percentuale è la stessa usata dal simulatore; mai un solo valore fisso.
- Effort: M.

### Ondata 3 — Prova, regia e fiducia

#### F-13 Kit Best Practice CSR

- Valore: rende tangibile la promessa di marketing e reporting a costo zero.
- Descrizione: pagina pubblica di impatto condivisibile (`/imprese/[slug]`) con scheda immagine, testo comunicato in tre lunghezze, contatore live degli euro ridistribuiti, risultati del torneo e biglietti vinti.
- Dove: `src/app/imprese/[slug]/page.tsx`, `src/lib/company.ts`, immagine con `ImageResponse`.
- Dati: derivati.
- Accettazione: i numeri coincidono con `/azienda`; nessun dato personale.
- Effort: M.

#### F-14 Indice di Coesione Territoriale per Borgo

- Valore: converte l'impatto in una storia confrontabile per i tavoli istituzionali.
- Descrizione: indice composito con componenti visibili (euro ridistribuiti, quota ai produttori, notti infrasettimanali, presenze a teatro, km evitati, voti e diffusione del torneo) e mappa coropletica.
- Dove: `src/lib/data.ts`, `src/app/destinazioni/[slug]/page.tsx`, mappe esistenti.
- Dati: derivati.
- Accettazione: formula mostrata nella pagina, nessun peso nascosto.
- Effort: M.

#### F-15 Registro Logistico Flotta Illiria

- Valore: prova visibile dei km addizionali zero.
- Descrizione: tratte ordinarie, ordini cesti aggregati per sede, stati (preparato, caricato, consegnato), km e CO2 evitati con distanza da 30 a 70 km (stesso input del simulatore).
- Dove: estende il registro consegne in `company-dashboard-view.tsx` e `producer-basket-order-client.tsx`.
- Dati: `fleet_routes`, `fleet_stops`, stato sull'ordine cesto.
- Accettazione: nessun doppio conteggio della CO2.
- Effort: M.

#### F-16 Pipeline Commerciale Illiria

- Valore: porta nella piattaforma la sinergia clienti esistenti contro nuovi clienti.
- Descrizione: Kanban in Control Room con prospect fittizi, fasi (contatto, proposta, adesione, piano attivo) e pulsante «Attiva piano» che riusa la creazione impresa, con scelta del tipo ente (F-04).
- Dove: tab in `/promotori`, tabella `prospects`.
- Accettazione: l'attivazione crea impresa, piano e referente tramite l'API esistente.
- Effort: M.

#### F-17 Simulatore Appalti e Criteri CAM

- Valore: dimostra il vantaggio competitivo nelle gare per gli enti pubblici.
- Descrizione: calcolatore illustrativo con volumi, quota filiera corta, km e CO2 evitati e frase di sintesi per l'offerta tecnica, sempre etichettato «stima dimostrativa».
- Dove: sezione di `/business-model` accanto a F-01.
- Effort: S.

#### F-18 Modalità Presentatore

- Valore: qualità riproducibile di ogni presentazione.
- Descrizione: menu «Percorso demo» con copioni (Vertici Illiria, Direttore HR, Ente Pubblico, Gestore di struttura), didascalie laterali, cambio ruolo automatico con gli account demo, ritorno al ripristino.
- Dove: `public-shell.tsx`, `header-menu.tsx`, `src/lib/demo-tours.ts`.
- Effort: M.

#### F-19 Valutazioni delle Esperienze

- Valore: fiducia e criterio di visibilità dei fornitori.
- Descrizione: voto 1-5 e commento dopo presenza confermata, media sulla scheda struttura, classifica per qualità in Control Room.
- Dove: tabella `venue_reviews`, `venue-card.tsx`, `provider-panel.tsx`.
- Accettazione: una valutazione per prenotazione con presenza confermata.
- Effort: M.

#### F-20 Centro Notifiche e Promemoria Simulati

- Valore: effetto della comunicazione senza SMTP.
- Descrizione: promemoria calcolati al volo: voucher da usare, finestra di riallocazione aperta, edizione del torneo in chiusura, biglietto omaggio disponibile, sfida del passaporto vicina. Non inseriti nel seed, per evitare notifiche improprie al primo accesso.
- Dove: `notifications` e `src/lib/data.ts`.
- Effort: S.

## 4. Roadmap aggressiva

| Ondata | Contenuto | Tracce parallele | Messaggio dimostrativo |
| :--- | :--- | :--- | :--- |
| 1 | F-01, F-02, F-03, F-04, F-05, F-06, F-07 | A economia, B engagement e viralità, C enti pubblici | Il modello si regge, cresce da solo e include anche gli enti pubblici. |
| 2 | F-08, F-09, F-10, F-11, F-12 | D prodotto, E operatività e partner | Mini-Vacanza, regole di riallocazione e valore per l'hotel. |
| 3 | F-13, F-14, F-15, F-16, F-17, F-18, F-19, F-20 | F prova e regia | Impatto dimostrato, canale Illiria, demo guidata. |

Sequenza minima per una demo di massimo impatto: F-04, F-01, F-06, F-07, F-05, F-02, F-11, F-18.

Dipendenze: F-05 e F-07 dipendono dal referral esistente; F-06 dipende da F-07 per il canale di voto; F-02 e F-12 riusano le funzioni di F-01; F-11 dipende dalla data di riferimento della demo; F-14 e F-13 leggono i dati del torneo.

Definizione di fatto per ogni funzione: build pulita, prova con account demo, prova di «Ripristina Dati Demo (Tutti)» con ritorno allo stato iniziale, nessuna notifica impropria, nota esplicativa aggiornata se cambia una business rule, aggiornamento di `Doc/TO_DO.md`.

## 5. Procedura di implementazione

1. Leggere questa skill, `Doc/architettura_e_ricognizione_funzionalita.md` e `Doc/note_esplicative_business_model.md`.
2. Lavorare su `restart-open-architecture-design`, un commit per funzione.
3. Schema: solo modifiche additive in `src/db/schema.ts`, aggiornare `src/db/seed.ts` e il reset (`/api/vouchers/reset-demo`). Nessun dato di test persistente.
4. Formule in `src/lib` come funzioni pure, usate da ogni schermata che mostra lo stesso numero (`src/lib/economics.ts` come fonte unica dei parametri).
5. UI con design system e `lucide-react`.
6. Aggiornare `/business-model` e le Note solo per variazioni vere delle business rule, con testi senza grassetto. Le regole R2-R8 vanno riportate nelle Note esplicative dopo l'implementazione.
7. Deploy con la skill `deploy-cloud-run` (servizio `welfare-impact`).

## 6. Che cosa non fare

- Non introdurre email reali, gateway di pagamento, fatturazione elettronica, conformità normativa o pratiche di gara reali.
- Non usare dati pseudo casuali né numeri non riconducibili a input o seed.
- Non cambiare i valori ufficiali (75 euro, 50 + 25, Matching Grant 50 euro per due persone, moltiplicatore 5,1x) senza aggiornare in blocco `/business-model` e le Note.
- Non confondere i biglietti omaggio del torneo con il Matching Grant: hanno origine, regole e costo diversi.
- Non presentare le stime come dati certificati: sempre «stima dimostrativa».
