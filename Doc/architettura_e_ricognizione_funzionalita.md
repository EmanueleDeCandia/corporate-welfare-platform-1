# RADICI — Architettura di Dominio, Fornitori e Ricognizione Funzionalità

> Documento di riferimento per l'allineamento definitivo tra modello di business, schema dati e implementazione software.

---

## 1. I 4 Soggetti del Dominio e i loro Ruoli

- **Impresa Cliente (CSR / HR)**: Eroga i Voucher Welfare aziendali per i propri dipendenti (solo Pernottamento e Cene KM 0). Riceve e rendiconta esclusivamente le Fatture Elettroniche B2B ex Art. 51 TUIR.
- **I Fornitori del Territorio**: Strutture convenzionate che accolgono sia i dipendenti con voucher welfare sia gli amici con carta.
  - **Agriturismi e Relais**: erogano sia **Pernottamento** (50€) sia **Cene/Degustazioni KM 0** (25€).
  - **Hotel e Dimore Storiche**: erogano sia **Pernottamento** (50€) sia **Cene/Bistrot** (25€). Inoltre ospitano l'incontro serale con gli artisti.
  - **Ristoranti, Osterie e Cantine**: erogano esclusivamente **Cene/Aperitivi e Degustazioni KM 0** (25€).
  - **Teatri Storici**: partner dei Promotori. Erogano lo spettacolo omaggio incluso nel Matching Grant per chi soggiorna o applicano il 10% di sconto per gli amici invitati.
- **Lavoratore / Dipendente**: Ha diritto a scegliere fino a 2 voucher (Pernottamento o Cena). Se sceglie il Pernottamento, sblocca automaticamente il Matching Grant.
- **I Promotori (Startup RADICI + Comuni / Regione)**: Non sono le imprese CSR. Finanziano il Matching Grant (50€) composto da Spettacolo a Teatro + Incontro artisti in Hotel + Evento civico del Comune.
- **Amici / Invitati (Consumer Privati)**: Pagano con carta privata beneficiando del 10% di sconto community. Ricevono normale scontrino fiscale e fanno guadagnare +1 punto impatto all'amico lavoratore.

---

## 2. Matrice di Compatibilità Riscatto Fornitori (`src/lib/utils.ts`)

| Tipologia Fornitore (`venues.type`) | Esempi | Voucher Pernottamento (`hotel`) | Voucher Cena (`aperitivo`) |
| :--- | :--- | :---: | :---: |
| `agriturismo` | Agriturismo La Valle, Podere Fontebella, Tenuta San Felice | ✅ ACCETTATO | ✅ ACCETTATO |
| `hotel` | Relais Langhe Oro, Palazzo dei Colli | ✅ ACCETTATO | ✅ ACCETTATO |
| `restaurant` | Osteria del Tiglio, Corte degli Ulivi | ❌ NON APPLICABILE | ✅ ACCETTATO |
| `theater` | Teatro Lauro Rossi, Teatro delle Muse | ❌ MATCHING GRANT PROMOTORI | ❌ MATCHING GRANT PROMOTORI |

---

## 3. Ricognizione Analitica Funzionalità

### A. FUNZIONALITÀ REALI SU DATABASE SQLITE
1. **Autenticazione & Sessioni**: Cookie HttpOnly, Hashing password, gestione 4 ruoli (`csr`, `employee`, `provider`, `friend`).
2. **Riscatto Immediato Voucher Welfare**: Assegnazione immediata del fornitore, passaggio a `redeemed`, transazione B2B registrata, notifica fiscale generata.
3. **Dashboard Impresa CSR (`/azienda`)**: Plafond 100 addetti, 200 voucher teorici, monitoraggio dipendenti, fascicolo fiscale B2B puro, vetrina fornitori.
4. **Certificati ESG Ufficiali**: Generazione PDF A4 reale con jsPDF, protocollo univoco, filigrana e impatto certificato.
5. **Codici QR**: Generazione dinamica PNG reale con node-qrcode per reception e referral.

### B. FUNZIONALITÀ CON LOGICA SU DB MA SIMULATE/MOCK NEL FRONTEND
1. **Checkout Carta Amici**: Scrive transazione `consumer_payment`, scontrino ed assegna +1 punto impatto su DB; la carta è validata solo sintatticamente (manca Stripe/Nexi reale).
2. **Social Kit Canvas**: Renderizza e scarica il file grafico su Canvas; la condivisione social è manuale (mancano API ufficiali LinkedIn/Meta).
3. **Pannello Fornitore**: Registra l'emissione fattura/scontrino su DB (`transactions.status = 'invoiced'`); non produce il file XML per il Sistema di Interscambio (SDI).

### C. FUNZIONALITÀ DA IMPLEMENTARE PER IL RILASCIO IN PRODUZIONE
1. **Driver Notifiche Email**: Integrazione provider SMTP/API (Resend/SendGrid) per recapito reale delle notifiche fiscali.
2. **Area Promotori Dedicata (`/promotori`)**: Cruscotto per la Startup e i Comuni per monitorare l'erogazione dei Matching Grant.
3. **Scanner QR Fornitore**: Fotocamera browser per scansione check-in dal vivo.

