# RADICI — Contenuti per Prossima Elaborazione del Sito

Documento di riferimento per i principi di sostenibilità, la logistica a impatto marginale zero della filiera corta e i parametri fisici/scientifici per i calcoli di CO₂ e km evitati.

---

## 1. Il Modello di Sostenibilità della Filiera Corta RADICI

La logistica industriale della GDO standard è strutturata su larga scala e ad altissima efficienza di saturazione dei carichi. Affermare che la filiera corta "risparmi 850 km rispetto alla GDO" è falso e metodologicamente errato.

Nel circuito **RADICI**, il reale ed esclusivo vantaggio ecologico risiede in due fattori a **impatto marginale zero**:

1. **Ritiro diretto in loco durante il soggiorno**:
   - L'ospite o il lavoratore beneficiario del welfare ritira il cesto direttamente presso il frantoio, il caseificio o la struttura ricettiva (agriturismo/relais) in cui già pernotta o consuma il pasto.
   - Tratte aggiuntive create per la consegna: **0 km**.

2. **Consegna sul tragitto ordinario dell'operatore (Sinergie di Trasporto)**:
   - I prodotti vengono recapitati sfruttando gli spostamenti già pianificati di una rete/flotta che si muove sul territorio per consegnare i **propri** prodotti (es. rotte ordinarie di distribuzione o rifornimento), mettendo a disposizione lo spazio residuo per i produttori locali.
   - Il mezzo avrebbe comunque percorso quel tragitto per la propria attività ordinaria: il consumo marginale e i km aggiuntivi generati dal trasporto del cesto sono pari a **0**.
   - Si evitano totalmente corrieri espressi dedicati a vuoto e imballaggi monouso complessi in polistirolo/cartone da spedizione.

---

## 2. Definizione del Risparmio: Tratta Eliminata vs Percorso Effettivo

### Concetto Fondamentale
I produttori o i vettori di sinergia **non compiono tragitti aggiuntivi**:
- La tratta percorsa dal veicolo in sharing è considerata a **costo marginale nullo (0 km)** poiché già necessaria per la sua attività commerciale primaria.
- Il risparmio ambientale effettivo calcolato dal sistema corrisponde alla **tratta di trasporto dedicata che viene integralmente ELIMINATA** (cioè il furgone espresso che sarebbe dovuto partire appositamente per recapitare il pacco singolo: da **40 km a 75 km a tratta**).

---

## 3. Tabella Scientifica di Riferimento per i Calcoli (Non Inventare Parametri)

I calcoli sulle emissioni di CO₂ evitata devono basarsi rigorosamente sui dati empirici standard di un veicolo commerciale leggero (furgone diesel di media età, ~10 anni), con consumo medio reale di **10 km con un litro** (pari a **10 litri / 100 km**) e fattore di emissione standard del gasolio di **2,65 kg di CO₂ per litro**:

| Distanza Tratta Evitata | Consumo Carburante Evitato | Emissioni CO₂ Evitate | Formula di Calcolo |
| :--- | :--- | :--- | :--- |
| **1 km** | 0,1 litri | **265 grammi (0,265 kg)** | `1 km × 0,1 L/km × 2,65 kg/L` |
| **40 km** (tratta minima evitata) | 4,0 litri | **10,60 kg CO₂** | `40 × 0,265` |
| **50 km** (tratta media standard) | 5,0 litri | **13,25 kg CO₂** | `50 × 0,265` |
| **70 km** (tratta estesa evitata) | 7,0 litri | **18,55 kg CO₂** | `70 × 0,265` |
| **75 km** (tratta massima evitata) | 7,5 litri | **19,88 kg CO₂** | `75 × 0,265` |
| **100 km** | 10,0 litri | **26,50 kg CO₂** | `100 × 0,265` |
| **10.000 km** (media annua veicolo) | 1.000 litri | **2.650 kg (2,65 tonnellate)** | `10.000 × 0,265` |

---

## 4. Specifiche UI e Testi per le Schede e i Cruscotti

### Intestazione Tab Filiera Produttori (Dashboard Promotori & CMS)
> *"I km logistici dedicati sono azzerati grazie al ritiro diretto in loco durante il soggiorno o alla consegna di prossimità sul tragitto ordinario di una impresa che consegna propri prodotti (non quelli dei produttori = sinergie di trasporto) e mette a disposizione la propria rete a km marginali zero per i produttori."*

### Card KPI Dashboard Promotori
- **Titolo Card**: `Km Dedicati Azzerati`
- **Sottotitolo Card**: `ritiro in loco / tragitto proprio`

### Colonna Tabella Ordini & Registro Filiera
- **Etichetta Colonna**: `Impatto KM 0`
- **Dato Mostrato**: `da 40 a 70 km dedicati azzerati`
- **Specifica Sottotitolo**: `ritiro in loco / tragitto proprio`
- **CO₂ Risparmiata**: Calcolata rigorosamente con la costante `0,265 kg CO₂/km` (es. 50 km = 13,2 kg CO₂).

---

## 5. Ricognizione Funzionalità: Scheda Produttori (`/strutture/[slug]`)

### Risposta alla Domanda Chiave
> **Domanda**: *"C'era una funzionalità che faceva il calcolo nella scheda Produttori, esiste più?"*

**Esito Ricognizione nel Repository**:
1. **Origine della Funzionalità**:
   - Introdotta nel commit storico `3a2a5c4` (*"v2: Produttori Locali KM 0 (Filiera Corta)"*).
   - Comprendeva il modulo [`src/lib/local-producers.ts`](../src/lib/local-producers.ts) e un layout dedicato in [`src/app/strutture/[slug]/page.tsx`](../src/app/strutture/[slug]/page.tsx) attivato quando `venue.type === "producer"`.
   - Mostrava un banner con 4 card di impatto per il singolo produttore:
     - Cestini venduti (`basketsSold`)
     - Volume vendite (`volumeCents`)
     - Percorso evitato (`kmAvoidedTotal` km)
     - CO₂ evitata (`co2AvoidedKg` kg)
   - Nella lista cesti laterale mostrava: `X km evitati · Y kg CO2 per cesto`.

2. **Stato Attuale nella Fase di Restart**:
   - **Nel Cruscotto Promotori ([`src/components/promoters-dashboard-view.tsx`](../src/components/promoters-dashboard-view.tsx))**: la sezione è presente, funzionante e sincronizzata, traccia tutti gli ordini, i produttori convenzionati e i KPI globali.
   - **Nella Pagina Singola Struttura ([`src/app/strutture/[slug]/page.tsx`](../src/app/strutture/[slug]/page.tsx))**: la pagina è attualmente unificata sul template generico ricettivo (camere e degustazioni). La sezione speciale dedicata al singolo produttore con il widget del calcolo cesti e dell'impatto ecologico va ripristinata e allineata con la formula scientifica (0,265 kg/km e tratte 40-75 km).
