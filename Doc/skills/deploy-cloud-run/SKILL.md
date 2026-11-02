---
name: deploy-cloud-run
description: Istruzioni operative, strategia di persistenza e comandi standard per il build e deploy dell'applicazione RADICI su Google Cloud Run. Usa questa skill quando devi rilasciare nuove revisioni, verificare l'architettura effimera demo o pianificare l'evoluzione del database.
---

# SKILL — Deploy su Google Cloud Run (RADICI)

## 0. Parametri di Configurazione

- **Progetto GCP**: `my-project-first-330911`
- **Region**: `europe-west1` (Belgio)
- **Servizio Cloud Run**: `local-welfare`
- **URL di produzione**: `https://local-welfare-898481966164.europe-west1.run.app`

## 1. Architettura Database: Pura DEMO Effimera (Scelta Intenzionale)

L'applicazione è progettata deliberatamente come **pura DEMO dimostrativa senza persistenza esterna**:

- **Perché SQLite in-container è ideale per la DEMO**:
  - **Zero infrastrutture esterne**: nessun database esterno da mantenere, configurare o pagare.
  - **Nessun rischio di "cold pause"**: a differenza dei database cloud free-tier (come i progetti Supabase free che vanno in pausa dopo 7 giorni di inattività), il container Cloud Run si avvia sempre all'istante con dati freschi e pronti.
  - **Latenza zero (0 ms)**: le query avvengono in-process nello stesso filesystem locale, garantendo la massima reattività durante le presentazioni.
  - **Ripristino istantaneo**: ogni nuova revisione, cold start o click sul pulsante «Ripristina Dati Demo» rigenera lo stato pulito dai seed senza incrostazioni o conflitti tra visitatori.
- **Regola obbligatoria**: `--max-instances 1` per fare in modo che tutte le richieste della sessione demo convergano sullo stesso container effimero.

## 2. Confronto Tecnologico: E se in futuro servisse vera persistenza? (Supabase vs Cloud SQL)

Se l'applicazione dovesse uscire dalla fase DEMO per diventare un'app multi-utente a produzione aperta:

- **Supabase è nettamente migliore di Cloud SQL per questa tipologia di app**:
  - **Semplicità e costi**: Cloud SQL su GCP ha costi fissi continui elevati e tempi lunghi di bootstrap/connessione via VPC connector o Cloud SQL Auth Proxy. Supabase offre Postgres serverless via connection pooling (pgbouncer/Supavisor), REST/GraphQL e autenticazione integrata (Auth & RLS) senza overhead di rete GCP.
  - **Scalabilità multi-istanza**: con un DB gestito esterno come Supabase, si può rimuovere il vincolo `--max-instances 1` e scalare Cloud Run a quante istanze si desidera.

> **Verdetto**: Per la **DEMO attuale**, SQLite effimero è imbattibile per zero-manutenzione e isolamento dei test. Per una **produzione persistente futura**, **Supabase** è la scelta architetturale raccomandata.

## 3. Comando di Deploy Standard

```bash
gcloud run deploy local-welfare \
  --source . \
  --region europe-west1 \
  --project my-project-first-330911 \
  --allow-unauthenticated \
  --max-instances 1 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars DEMO_MODE=true,NEXT_PUBLIC_APP_URL=https://local-welfare-898481966164.europe-west1.run.app
```

## 4. Variabili d'Ambiente

| Variabile | Valore | Descrizione |
| :--- | :--- | :--- |
| `DEMO_MODE` | `true` | Abilita i percorsi dimostrativi, login demo rapido e reset seed |
| `NEXT_PUBLIC_APP_URL` | `https://local-welfare-898481966164.europe-west1.run.app` | Base URL per la generazione di codici QR e link condivisibili |
