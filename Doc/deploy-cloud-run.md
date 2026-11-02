# Deploy su Google Cloud Run

RADICI gira su Cloud Run **senza modifiche al codice**: il `Dockerfile` nella radice è già
scritto per quell'ambiente (compila `better-sqlite3`, esegue `npm run build`, espone la 8080
e ascolta su `0.0.0.0`).

> 💡 **Architettura Pura DEMO (Nessuna persistenza):** il database è volutamente un file SQLite (`radici.db`) su filesystem
> **effimero** in-container. Su Cloud Run questo significa:
> - Il DB parte sempre pulito dal seed a ogni cold start / nuova revision;
> - Zero dipendenze esterne, zero costi di database remoto, zero latenze di rete e nessun rischio di pause da inattività;
> - Il pulsante «Ripristina Dati Demo» consente di resettare lo stato all'istante in qualunque momento.
> - Con `--max-instances 1` le sessioni demo operano sul container unico in modo coerente.
>
> 🚀 **Evoluzione futura verso persistenza reale:** se in futuro l'applicazione dovesse uscire dalla modalità DEMO
> e richiedere persistenza permanente multi-istanza, la soluzione raccomandata e più efficiente è **Supabase**
> (Postgres gestito con connection pooling e Auth integrata), nettamente più snello ed economico rispetto a Cloud SQL.

---

## Progetto e Region Attivi in Google Cloud

- **Progetto GCP**: `my-project-first-330911`
- **Region attiva**: `europe-west1` (Belgio, region di riferimento del progetto GCP)
- **Servizio Cloud Run attivo**: `local-welfare`
- **URL di produzione live**: `https://local-welfare-898481966164.europe-west1.run.app`

---

## Deploy in un comando (Cloud Build incluso)

Dalla radice del repository, con `gcloud` autenticato (`gcloud auth login`) e il progetto attivo:

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

`--source .` attiva **Cloud Build**: costruisce l'immagine dal `Dockerfile` e la pubblica su
Artifact Registry (`europe-west1-docker.pkg.dev/my-project-first-330911/cloud-run-source-deploy`),
senza che tu debba fare `docker build`/`push` a mano. La prima build richiede qualche minuto
(compilazione di `better-sqlite3`); le successive sono cache-ate.

### Perché questi flag

| Flag | Motivo |
| :--- | :--- |
| `--max-instances 1` | **obbligatorio**: con più istanze ogni container avrebbe il suo `radici.db` |
| `--region europe-west1` | Region del progetto `my-project-first-330911` |
| `--allow-unauthenticated` | serve per l'accesso pubblico alla demo |
| `--memory 1Gi` | il build di Next 16 + Turbopack è più stabile con 1 GB |
| `NEXT_PUBLIC_APP_URL` | usato dal codice per comporre gli URL pubblici (QR, inviti) |

---

## Variabili d'ambiente

| Variabile | Valore consigliato | A cosa serve |
| :--- | :--- | :--- |
| `DEMO_MODE` | `true` | abilita i percorsi dimostrativi |
| `NEXT_PUBLIC_APP_URL` | `https://local-welfare-898481966164.europe-west1.run.app` | base URL per QR e link di invito |
| `CRON_SECRET` | *opzionale* | se usi il job `/api/cron/grant-confirmations` via Cloud Scheduler |

---

## Aggiornamenti e rollback

```bash
# Nuova revision
gcloud run deploy local-welfare --source . --region europe-west1 --project my-project-first-330911

# Elenco revisioni
gcloud run revisions list --service local-welfare --region europe-west1 --project my-project-first-330911

# Spostamento traffico a revisione specifica
gcloud run services update-traffic local-welfare --region europe-west1 --project my-project-first-330911 --to-revisions <REV>=100
```
