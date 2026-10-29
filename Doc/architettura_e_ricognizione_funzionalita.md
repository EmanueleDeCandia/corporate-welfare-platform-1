# RADICI — Architettura di Dominio, Fornitori e Ricognizione Funzionalità

> Documento di riferimento per l'allineamento definitivo tra modello di business, schema dati e implementazione software.

---

## 1. I 4 Soggetti del Dominio e i loro Ruoli

1. **Impresa Cliente (CSR / HR)** (es. ACME S.p.A.):
   - Finanzia il plafond welfare per i propri dipendenti: solo **Pernottamento** (50€) e **Cene/Aperitivi KM 0** (25€).
   - Riceve e salda esclusivamente fatture elettroniche B2B deducibili ex Art. 51 TUIR emesse dai fornitori territoriali.

2. **I Fornitori del Territorio** (`/fornitore`):
   - Strutture ricettive e della ristorazione convenzionate:
     - **Agriturismi e Relais**: erogano Pernottamento (50€) e Cene KM 0 (25€).
     - **Hotel e Dimore Storiche**: erogano Pernottamento (50€), Cene KM 0 (25€) e ospitano l'incontro serale con gli artisti.
     - **Ristoranti, Osterie e Cantine**: erogano esclusivamente Cene/Aperitivi KM 0 (25€).
     - **Teatri Storici Convenzionati**: erogano lo spettacolo culturale legato al matching grant.
   - Emettono fattura B2B diretta all'azienda per i voucher welfare e scontrino/ricevuta per i pagamenti carta degli amici.

3. **Lavoratore / Dipendente** (`/account`):
   - Ha diritto a riscattare fino a 2 voucher del suo massimale welfare (1 Notte + 1 Cena).
   - Quando riscatta il pernottamento, ha diritto al **Matching Grant Culturale dei Promotori**.
   - Invita amici e accumula Punti Impatto quando questi spendono nel circuito.

4. **I PROMOTORI (Startup RADICI + Partner Promotori Privati / Fondazioni)** (`/promotori`):
   - **Chi sono**: È l'entità terza di regia composta dalla **Startup RADICI** e dai **partner promotori privati** (fondazioni territoriali, sponsor culturali e mecenati privati del circuito). **NON sono l'impresa CSR** (che non può pagare teatri per vincoli TUIR) e **NON è il Comune** (che non finanzia i soggiorni dei dipendenti).
   - **Il loro ruolo**: Istituiscono e alimentano il **Fondo Matching Grant Culturale (50€)**.
   - **Modello Economico**: La Startup copre completamente il costo del Matching Grant con i servizi che gestisce per conto delle imprese di ricettività beneficiarie del welfare Aziendale.
   - **Composizione del Matching Grant**: Ogni volta che un dipendente riscatta un voucher di tipo Pernottamento (50€), il sistema attiva in automatico il pacchetto culturale complementare valido per 2 persone. Un singolo addetto /a con un amico /a, familiare, partner. Il Matching Grant ha il valore di 25€ + 25€ e non può essere usato totalmente da una singola persona. Include l'accesso a Teatro e l'incontro serale esclusivo con gli artisti presso la struttura ricettiva.
   - **Area Dedicata**: Cruscotto `/promotori` per la governance del fondo, capienza residua, registro dei grant attivati per dipendente e convenzioni con i teatri storici.

5. **Amici / Invitati (Consumer Privati)** (`/r/[code]`):
   - Ricevono il 10% di sconto community, acquistano con propria carta di credito e riconoscono +1 punto impatto all'amico lavoratore.

---

## 2. Matrice di Compatibilità Riscatto Fornitori (`src/lib/utils.ts`)

| Tipologia Fornitore (`venues.type`) | Esempi | Voucher Pernottamento (`hotel`) | Voucher Cena (`aperitivo`) |
| :--- | :--- | :---: | :---: |
| `agriturismo` | Agriturismo La Valle, Podere Fontebella, Tenuta San Felice | ✅ ACCETTATO | ✅ ACCETTATO |
| `hotel` | Relais Langhe Oro, Palazzo dei Colli | ✅ ACCETTATO | ✅ ACCETTATO |
| `restaurant` | Osteria del Tiglio, Corte degli Ulivi | ❌ NON APPLICABILE | ✅ ACCETTATO |
| `theater` | Teatro Lauro Rossi, Teatro delle Muse | ❌ MATCHING GRANT PROMOTORI | ❌ MATCHING GRANT PROMOTORI |

---

## 3. Stato delle Funzionalità & Roadmap

### A. FUNZIONALITÀ ATTIVE E CONFERMATE
1. **Autenticazione & Sessioni**: Ruoli `csr`, `employee`, `provider`, `friend`.
2. **Riscatto Immediato Voucher Welfare**: Assegnazione fornitore, passaggio a `redeemed`, transazione B2B registrata, notifica per la struttura.
3. **Dashboard Impresa CSR (`/azienda`)**: Plafond 100 addetti, 200 voucher welfare max, monitoraggio dipendenti, fascicolo B2B puro, vetrina territoriale.
4. **Certificati ESG Ufficiali**: Generazione PDF A4 con protocollo univoco.
5. **Vetrina & Referral Amici (`/r/[code]`)**: Listino convenzionato con sconto 10% community e link diretto.

### B. FUNZIONALITÀ SOSPESE (In attesa di valutazione futura)
1. **Validazione Presenza / Check-in & No-Show Fornitore**:
   - **Stato**: *SOSPESA*. Il codice e lo schema DB non sono stati modificati e restano puliti all'assetto originario. Verrà valutato in seguito se e come tracciare il check-in fisico o il no-show senza appesantire il flusso del fornitore.
2. **Driver Reale Notifiche Email (SMTP/Resend)**:
   - **Stato**: *SOSPESA / FUTURA*.
3. **Flusso SDI / XML Fattura Elettronica**:
   - **Stato**: *SOSPESA / FUTURA*.
4. **Gateway di Pagamento Reale (Stripe/Nexi)**:
   - **Stato**: *SOSPESA / FUTURA*.

### C. LA MANCANZA FONDAMENTALE DEL SISTEMA: I PROMOTORI
- Attualmente la piattaforma gestisce l'Azienda CSR, il Fornitore, il Dipendente e l'Amico, ma **manca la parte attiva dei Promotori**:
  - Non esiste un cruscotto dedicato (`/promotori` o dashboard di gestione del fondo Promotori).
  - Il Matching Grant da 50€ (Teatro + Incontro con gli Artisti) viene generato concettualmente ma non è gestito, monitorato né liquidato da un'interfaccia o fondo contabile dedicato ai Promotori.
  - La gestione di questo soggetto è la vera entità mancante per chiudere l'ecosistema a 4 ruoli di RADICI.
  - I promotori devono conoscere quanti sono i Voucher "assegnati" (dall'impresa CSR)  quanti di questi hanno hanno pronotato il Voucher nella piattaforma (l'impresa appena prenotano pagano anche se non si prsentano) e quanti di questi hanno usato il voucher presentandosi; quanti Matching Grant hanno prenotato nella piattaforma e quanti effettivamente sono stati utilizzati.  Inoltre devono conoscere il plafond residuo del fondo Matching Grant.
