# Deploy su Google Cloud Run

RADICI gira su Cloud Run **senza modifiche al codice**: il `Dockerfile` nella radice è già
scritto per quell'ambiente (compila `better-sqlite3`, esegue `npm run build`, espone la 8080
e ascolta su `0.0.0.0`).

> ⚠️ **Il vincolo da capire prima:** il database è un file SQLite (`radici.db`) su filesystem
> **effimero**. Su Cloud Run questo significa:
> - il DB si ricrea dal seed a ogni cold start / nuova revision;
> - **più istanze = più database separati**, quindi sessioni (`?sid=`) e voucher non sarebbero
>   condivisi.
>
> Per una **demo** va benissimo: è il motivo per cui l'app ha il pulsante «Ripristina Dati Demo».
> Per dati persistenti serve Postgres gestito (Cloud SQL) oppure un volume NFS (Filestore).
> Cloud Storage FUSE **non** è adatto: SQLite richiede un locking che FUSE non garantisce.

---

## Deploy in un comando (Cloud Build incluso)

Dalla radice del repository, con `gcloud` autenticato (`gcloud auth login`) e un progetto attivo:

```bash
gcloud run deploy radici \
  --source . \
  --region europe-west8 \
  --allow-unauthenticated \
  --max-instances 1 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars DEMO_MODE=true,NEXT_PUBLIC_APP_URL=https://radici-REPLACE.a.run.app
```

`--source .` attiva **Cloud Build**: costruisce l'immagine dal `Dockerfile` e la pubblica su
Artifact Registry, senza che tu debba fare `docker build`/`push` a mano. La prima build richiede
qualche minuto (compilazione di `better-sqlite3`); le successive sono cache-ate.

### Perché questi flag

| Flag | Motivo |
| :--- | :--- |
| `--max-instances 1` | **obbligatorio**: con più istanze ogni container avrebbe il suo `radici.db` |
| `--region europe-west8` | Milano: latenza minima per il pubblico italiano |
| `--allow-unauthenticated` | serve per l'accesso pubblico alla demo |
| `--memory 1Gi` | il build di Next 16 + Turbopack è più tranquillo con 1 GB |
| `NEXT_PUBLIC_APP_URL` | usato dal codice per comporre gli URL pubblici (QR, inviti) |

### Dopo il primo deploy

Il servizio ottiene un URL del tipo `https://radici-123456789012.europe-west8.run.app`.
Aggiorna `NEXT_PUBLIC_APP_URL` con quello **reale** e rilancia lo stesso comando: le variabili
sono lette all'avvio del container.

---

## Variabili d'ambiente

| Variabile | Valore consigliato | A cosa serve |
| :--- | :--- | :--- |
| `DEMO_MODE` | `true` | abilita i percorsi dimostrativi |
| `NEXT_PUBLIC_APP_URL` | URL del servizio | base URL per QR e link di invito |
| `CRON_SECRET` | *opzionale* | se usi il job `/api/cron/grant-confirmations` via Cloud Scheduler |

Nessun segreto è committato nel repo: `.env` contiene solo `DEMO_MODE` e `NEXT_PUBLIC_APP_URL`.

---

## Aggiornamenti e rollback

```bash
gcloud run deploy radici --source . --region europe-west8   # nuova revision
gcloud run revisions list --service radici --region europe-west8
gcloud run services update-traffic radici --region europe-west8 --to-revisions <REV>=100
```

Ogni deploy azzera il database (filesystem nuovo): è il comportamento atteso.

---

## Scale-to-zero e avvio a freddo

Con le impostazioni predefinite il servizio va a zero quando non riceve traffico e il primo
hit ricostruisce il database dal seed (pochi secondi). Se devi fare una **demo dal vivo** senza
attese:

```bash
gcloud run services update radici --region europe-west8 --min-instances 1
```

Ricordati di riportarlo a `0` dopo, per non consumare quota.

---

## Alternativa: senza Cloud Build (solo immagine locale)

```bash
docker build -t europe-west8-docker.pkg.dev/PROGETTO/radici/app:latest .
docker push europe-west8-docker.pkg.dev/PROGETTO/radici/app:latest
gcloud run deploy radici \
  --image europe-west8-docker.pkg.dev/PROGETTO/radici/app:latest \
  --region europe-west8 --allow-unauthenticated --max-instances 1
```

Richiede `gcloud auth configure-docker europe-west8-docker.pkg.dev` una volta sola.

---

## Checklist prima di condividere il link

- [ ] `--max-instances 1` impostato
- [ ] `NEXT_PUBLIC_APP_URL` uguale all'URL pubblico reale
- [ ] `/` , `/vantaggi`, `/strutture`, `/come-funziona` rispondono 200
- [ ] login demo (`mario.rossi@acme.it` / `radici2026`) funziona e `/account` si apre
- [ ] `next` aggiornato a una versione senza CVE note (la 16.2.6 attuale ha fix in 16.4.1)
