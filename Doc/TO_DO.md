# RADICI — Piano di Lavoro e Priorità Future (TO_DO)

Documento di sintesi delle attività programmate per la prossima fase di sviluppo, rifinitura e redesign della piattaforma **RADICI Welfare Territoriale**.

---

## 📌 Checklist Attività

### [0] Aggiornamento della Documentazione e README
- [ ] Aggiornare il file [`README.md`](../README.md) con le nuove specifiche architetturali:
  - Ruoli utente distinti (`promoter`, `csr`, `provider`, `theater`, `employee`, `friend`).
  - Funzionalità CMS per il Promotore (inserimento, modifica ed eliminazione di Fornitori, Eventi e Imprese CSR).
  - Sistema di calcolo non arbitrario delle metriche territoriali (moltiplicatore economico locale 5,1x, calcolo dinamico CO₂ da ordini Filiera Corta).
  - Meccanismo di sicurezza contabile anti-overbooking e tracciamento presenze per teatri e strutture.
  - Endpoint di caricamento file immagini (`/api/upload`) con salvataggio locale.
- [ ] Revisionare e aggiornare i documenti tecnici nella cartella [`doc/`](./):
  - Allineare `architettura_e_ricognizione_funzionalita.md` con il nuovo schema database SQLite/Drizzle.
  - Documentare le API di gestione promoter in `doc/api_promotori.md`.

---

### [1] Inserimento Foto Reali delle Località e Realistiche dei Fornitori
- [ ] Reperire e integrare fotografie ad alta risoluzione e realistiche per:
  - Destinazioni e borghi storici (Conero, Sibillini, Val d'Orcia, Langhe, Salento).
  - Strutture ricettive autentiche (casali in pietra, agriturismi a conduzione familiare, relais).
  - Produttori della filiera corta (frantoi, cantine, caseifici artigianali, pastifici).
  - Teatri storici e spazi culturali convenzionati (Teatro Lauro Rossi, palcoscenici storici).
- [ ] Sostituire i mockup grafici temporanei con immagini coerenti nel database di seed e nei preset del CMS (`COVER_PRESETS`).

---

### [2] Completamento e Aggiornamento della Pagina "Come Funziona"
- [ ] Aggiornare la pagina pubblica [`/come-funziona`](../src/app/come-funziona/page.tsx) per illustrare chiaramente l'intero ecosistema RADICI:
  - **Per le Imprese CSR**: come finanziare il welfare territoriale, deducibilità fiscale, rating ESG, impatto sullo sviluppo locale e moltiplicatore 5,1x per l'indotto dei borghi.
  - **Per i Dipendenti**: fruizione del voucher pernottamento/cena, accesso automatico all'omaggio Matching Grant (50€ per 2 persone o 25€ singolo) erogato dai Promotori per gli eventi culturali, e acquisto cesti km 0.
  - **Per la Community / Amici Invitati**: riscatto dello sconto convenzionato del 10% tramite codice referral, prenotazioni trasparenti e conferma di presenza anti-overbooking.
  - **Per i Fornitori e Teatri**: cruscotto dedicato, convalida presenze, contrasto no-show e liquidazione contabile trasparente.

---

### [3] Pulizia e Rimozione delle Imprese CSR Demo di Test
- [ ] Eseguire una bonifica controllata delle anagrafiche demo e di test inserite durante le sessioni di verifica:
  - Mantenere solo le aziende di riferimento per la presentazione demo (es. *ACME Corporation S.p.A.*).
  - Rimuovere record duplicati o generati da script di test automatici che non hanno transazioni contabili attive vincolanti.
  - Aggiornare lo script di seed [`src/db/seed.ts`](../src/db/seed.ts) per generare esclusivamente dati demo puliti, coerenti e realistici.

---

### [4] Rifinitura dello Stile Grafico e Figurativo (Design Coerente)
- [ ] Revisionare l'intera interfaccia utente eliminando elementi visivi spuri o non allineati:
  - Armonizzare la palette cromatica: verde bosco (`forest`), terracotta (`terracotta`), sabbia/crema (`cream`), oro (`gold`) e terra di siena.
  - Sostituire le emoji informative nei form con icone vettoriali minimali (`lucide-react`) coerenti con il design system.
  - Uniformare i componenti UI (modali, badge, pulsanti di azione, tabelle dati, form di caricamento foto).
  - Rimuovere stili contrastanti o non conformi allo spirito di sobrietà ed eleganza del circuito RADICI.

---

### [5] Creazione Versione Design Alternativa (`restart-open-architecture-design`)
- [ ] Creare e configurare il branch dedicato: `restart-open-architecture-design`.
- [ ] Definire una skill dedicata al design (`DESIGN.md` / `SKILL.md`) che stabilisca:
  - Principi estetici, tipografia serif/sans, gerarchie visive e spacing.
  - Varianti di layout per le schede fornitore, le pagine aziendali CSR e i cruscotti di backoffice.
  - Preservazione assoluta di tutte le logiche di business, dello schema dati e delle API esistenti.

---

*Documento creato a chiusura della fase di consolidamento funzionale. Tutte le funzionalità attuali sono convalidate al 100% su `restart-open-architecture`.*
