# Guida ai Dati di Default (Seed) & Separazione tra Versione Open Architecture e Cloud Run

Questo documento fa chiarezza definitiva sui dati di default (seed) presenti nel database di **questa versione dell'applicazione (`restart-open-architecture-design`)**, evidenziando la separazione rigorosa sia logico-concettuale sia tecnica rispetto alla versione **`Originale-Cloud-Run`**.

---

## 1. Architettura e Separazione Fisica delle Versioni

Per garantire che le due versioni non interferiscano tra loro e che i differenti schemi dati non generino conflitti (come l'errore `no such column: venues.aperitivo_menu`), le istanze sono state isolate in due percorsi e porte distinte:

| Parametro | Questa Versione (Locale / Open Architecture) | Versione Originale (Cloud Run) |
| :--- | :--- | :--- |
| **Branch Git** | `restart-open-architecture-design` | `production/cloudrun-demo` |
| **Cartella Locale** | `C:\Users\user\Desktop\radici` | `C:\Users\user\Desktop\radici-cloudrun` |
| **Porta HTTP** | `http://localhost:3000` | `http://localhost:3001` |
| **Database SQLite** | `radici.db` (nella radice di `radici`) | `radici-cloudrun.db` (isolato in `radici-cloudrun`) |
| **Comando di Avvio** | `npm run dev` | Doppio click su `Avvia-Radici-CloudRun.bat` |
| **Evoluzioni Schema** | Supporta `bookings`, `venue_offerings`, `grant_events`, `matching_grants`, `venues.rooms` (JSON), `venues.aperitivo_menu` (JSON), listino camere personalizzato | Schema iniziale privo di colonne JSON dinamiche e senza gestione avanzata multi-offerte camere |

---

## 2. Elenco Completo Dati di Default nel Seed (Questa Versione)

Tutti gli account di test utilizzano la password predefinita: **`radici2026`**.

### 2.1 Utenti e Ruoli Preconfigurati

| Nome e Cognome | Email | Ruolo Piattaforma | Ente / Struttura di Riferimento | Dettagli Profilo & Cassetti |
| :--- | :--- | :--- | :--- | :--- |
| **Chiara Valenti** | `chiara.promotori@radici.it` | `promoter` | **Startup Promotrice RADICI** | Cruscotto `/promotori`: monitoraggio overbooking, analytics, fondi matching grant |
| **Elena Martini** | `elena.martini@acme.it` | `csr` | **ACME Corporation** | Cruscotto `/azienda`: welfare manager, 120 dipendenti, 60.000 € plafond |
| **Sofia Neri** | `sofia.neri@verdeenergia.it` | `csr` | **Verde Energia Spa** | Cruscotto `/azienda`: welfare manager, 80 dipendenti, 40.000 € plafond |
| **Mario Rossi** | `mario.rossi@acme.it` | `employee` | Dipendente ACME Corporation | Cruscotto `/account`: 1 Voucher Pernottamento (50 €) + 1 Voucher Cena (25 €) |
| **Giulia Verdi** | `giulia.verdi@acme.it` | `employee` | Dipendente ACME Corporation | Cruscotto `/account`: Voucher welfare pronti per selezione test |
| **Davide Ferri** | `davide.ferri@acme.it` | `employee` | Dipendente ACME Corporation | Cruscotto `/account`: Profilo dipendente con selezioni storiche |
| **Luigi Bianchi** | `luigi.bianchi@email.it` | `friend` | Ospite Community (Invitato da Mario Rossi) | Cruscotto `/account`: Sconto 10% garantito, pagamenti privati con carta |
| **Francesca Romani** | `francesca.romani@email.it` | `friend` | Ospite Community (Accompagnatrice / Moglie) | Profilo consumer separato per saldare quota propria senza toccare il welfare |
| **Elena La Valle** | `elena@lavalle.it` | `provider` | **Agriturismo La Valle dei Racconti** | Cruscotto `/fornitore`: distinta welfare B2B, check-in, listino camere |
| **Sandro Colle** | `sandro@agriturismocolle.it` | `provider` | **Agriturismo Il Colle dei Poeti** | Cruscotto `/fornitore`: struttura rurale Caldarola, 2 offerte camere |
| **Marco Langhe** | `marco@langheoro.it` | `provider` | **Relais Langhe Oro** | Cruscotto `/fornitore`: hotel di charme Barolo, distinte welfare |
| **Giovanni Fontebella** | `giovanni@fontebella.it` | `provider` | **Podere Fontebella** | Cruscotto `/fornitore`: agriturismo Val d'Orcia, gestione camere |
| **Chiara Masseria** | `chiara@masseria.it` | `provider` | **Masseria Le Grazie** | Cruscotto `/fornitore`: masseria fortificata Ostuni, gestione camere |
| **Matteo Tiglio** | `matteo@osteriadeltiglio.it` | `provider` | **Osteria del Tiglio** | Cruscotto `/fornitore`: ristorazione tipica recanatese (solo cena/aperitivo) |
| **Marco Frantoio** | `marco@frantoioconero.it` | `provider` | **Frantoio del Conero** | Cruscotto `/fornitore`: produttore filiera corta KM 0 (olio EVO & cesti) |
| **Sara Caseificio** | `sara@caseificiosibillini.it` | `provider` | **Caseificio Bio dei Sibillini** | Cruscotto `/fornitore`: produttore filiera corta KM 0 (formaggi bio) |
| **Paolo Luzi** | `paolo@teatrolauro.it` | `theater` | **Teatro Lauro Rossi (Macerata)** | Cruscotto `/teatro`: botteghino, convalida ingressi, capienza posti |

---

### 2.2 Strutture Ricettive e Offerte Camere Convenzionate

Ogni struttura ricettiva che offre pernottamento presenta **almeno 2 offerte camere** configurate di default:

1. **Camera Singola (Convenzione Welfare Aziendale · 1 Persona)**:
   - **Prezzo Convenzionato**: **50,00 €**
   - **Posti Letto**: 1
   - **Copertura Welfare**: 100% coperto da 1 Voucher Welfare nominativo dell'addetto (Art. 51 TUIR).
   - **Condizione Posti Aggiuntivi**: Se il dipendente prenota per 2 persone/posti letto, il prezzo convenzionato per la seconda persona è identico (altri 50,00 €).
2. **Camera Doppia (1 Quota Welfare + 1 Quota Accompagnatore)**:
   - **Prezzo Convenzionato Totale**: **100,00 €**
   - **Posti Letto**: 2
   - **Ripartizione Fiscale**: 50,00 € coperti dal Voucher Welfare dell'addetto + 50,00 € per la seconda persona / accompagnatore non beneficiario di voucher.
   - **Modalità di Pagamento Accompagnatore**: La quota di 50,00 € può essere pagata con carta di credito personale dall'addetto (distinguendola dal welfare B2B) o direttamente dall'invitato (su piattaforma o al momento del check-in).
3. **Condizioni Trasparenti per Amici e Ospiti Community (senza welfare)**:
   - I prezzi di listino base sono identici (50,00 € singola, 100,00 € doppia).
   - Gli invitati della Community RADICI beneficiano dello **sconto esclusivo del 10%** (45,00 € singola / 90,00 € doppia) saldabile per intero con la propria carta personale, generando Punti Impatto per chi li ha invitati.

#### Dettaglio Strutture nel Seed:

| Struttura | Tipologia | Comune (Prov) | Camere Convenzionate | Ristorazione KM 0 | Cesto Tipico |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Agriturismo La Valle** | Agriturismo | San Ginesio (MC) | Singola (50 €) · Doppia (100 €) | Aperitivo & Cena (25 €) | — |
| **Agriturismo Colle** | Agriturismo | Caldarola (MC) | Singola (50 €) · Doppia (100 €) | Degustazione Monti Azzurri (24 €) | Cesto Caldarola (35 €) |
| **Relais Langhe Oro** | Hotel di Charme | Barolo (CN) | Singola (50 €) · Doppia (100 €) | Gran Tagliere Langarolo (28 €) | — |
| **Podere Fontebella** | Agriturismo | Pienza (SI) | Singola (50 €) · Doppia (100 €) | Degustazione Pecorai (24 €) | — |
| **Masseria Le Grazie** | Masseria | Ostuni (BR) | Singola (50 €) · Doppia (100 €) | Pittule e Bombette (22 €) | — |
| **Osteria del Tiglio** | Ristorante Tipico | Recanati (MC) | — (Solo Ristorazione) | Cena sotto il Tiglio (25 €) | — |

---

### 2.3 Produttori della Filiera Corta KM 0

I cesti agroalimentari sono prodotti da cooperative e aziende agricole locali:

| Produttore | Territorio | Cesto Tipico KM 0 | Prezzo Listino | Note di Acquisto |
| :--- | :--- | :--- | :--- | :--- |
| **Frantoio del Conero** | Sirolo (AN) · Riviera del Conero | *Cesto Conero Oro Verde* | 38,00 € (34,20 € con sconto 10% community) | Olio EVO Monocultivar Raggia Bio (3x750ml) + Carciofini sott'olio KM 0 |
| **Caseificio Bio dei Sibillini** | Amandola (FM) · Parco Monti Sibillini | *Cesto Casaro dei Monti Azzurri* | 42,00 € (37,80 € con sconto 10% community) | Pecorino di Fossa DOP, Caciotta al tartufo estivo, miele di melata |

> [!IMPORTANT]
> **Regola Fondamentale del Portafoglio Welfare degli Addetti:**
> Gli acquisti di cesti agroalimentari KM 0 e le prenotazioni private per accompagnatori **non sono prestazioni welfare erogabili tramite voucher** (ai sensi dell'Art. 51 TUIR). Pertanto, nel profilo dell'addetto (`/account`), la sezione "Portafoglio Welfare" mostra **SOLO ED UNICAMENTE I VOUCHER WELFARE AZIENDALI** (disponibili, selezionati, usufruiti). Gli acquisti di cesti e le quote private risiedono esclusivamente nella scheda **"Prenotazioni & Sconti"**.

---

### 2.4 Teatri e Matching Grant Promotori RADICI

I biglietti per gli spettacoli e gli incontri con gli artisti sono finanziati al 100% dalla Startup Promotrice RADICI come "Matching Grant":

| Spettacolo / Evento | Teatro e Sede | Capienza | Valore Matching Grant | Benefit Inclusi |
| :--- | :--- | :--- | :--- | :--- |
| **Stagione di Prosa e Visita nel Ridotto** | Teatro Lauro Rossi (Macerata) | 40 posti | 50,00 € (25 € cad. per 2 posti) | Biglietti riservati + incontro con attori nel ridotto |
| **Concerto Sinfonico nel Foyer** | Teatro delle Muse (Ancona) | 50 posti | 50,00 € (25 € cad. per 2 posti) | Biglietti concerto + brindisi nel foyer |
| **Rassegna Teatrale Storica** | Teatro dell'Aquila (Fermo) | 35 posti | 50,00 € (25 € cad. per 2 posti) | Ingressi platea + visita guidata al sipario storico |

---

## 3. Gestione e Modifica del Listino da Parte dei Fornitori

Ogni hotel e agriturismo può:
1. Accedere a `/fornitore` con le proprie credenziali (es. `elena@lavalle.it` o `sandro@agriturismocolle.it`).
2. Cliccare sulla scheda **"Offerte Camere & Convenzioni"**.
3. Modificare prezzi, capienze (singola o doppia) e testi esplicativi.
4. Salvare con un click: i dati vengono sincronizzati immediatamente su `venues.rooms` e `venue_offerings`, aggiornando in tempo reale la pagina pubblica `/strutture/[slug]`.
5. Ripristinare in qualsiasi momento le tariffe standard welfare con il pulsante *"Ripristina Offerte Standard"*.
