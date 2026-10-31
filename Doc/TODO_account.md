# TODO — account e ruoli

Riprendere da questo branch (`arena/7da148b6-corporate-welfare-platform-1`) dopo il PR.

## Problema attuale (abbreviato)

- **Hydration mismatch** in `HeaderMenu` (`src/components/header-menu.tsx`): HTML server ≠ client.
  - Client: link nome utente (`<a class="hidden items-center…">`).
  - Server: placeholder AfterHydration (`div.min-h-[16rem]`).
  - Causa: `fallback={null}` è ignorato (`null ?? default` → box bianco). Overlay Recoverable Error su `/account`.
- **Logout instabile**: in preview `logoutClient` / export di `session-client` risultano “not a function” su alcuni ruoli (bundle Turbopack stale). Elena Martini (CSR) è l’unico flusso che oggi non dà errore.
- **Sessione iframe**: `?sid=` tiene loggati sulle pagine pubbliche; il logout deve cancellare DB + cookie + URL, altrimenti si rientra da soli.

## Da verificare — tutti i ruoli

Password demo: `radici2026`. Per ciascuno: login → area giusta → Esci → login pulito, **senza overlay hydration**.

| Ruolo | Demo | Area | Check |
| --- | --- | --- | --- |
| Dipendente | `mario.rossi@acme.it` | `/account` | overlay header, Esci, voucher 1+1 |
| Dipendente | `luca.bianchi@acme.it` | `/account` | stesso; Luca ≠ amico |
| Amico / consumer | `luigi.bianchi@email.it` | `/account` | pay-local, inviti; no voucher |
| CSR / impresa | `elena.martini@acme.it` | `/azienda` | dashboard, extra, Esci (oggi OK) |
| Fornitore | `elena@lavalle.it` | `/fornitore` | presenze, fatture pending/settled, Esci (prima OK, ora rotto) |
| Promotore | `chiara.promotori@radici.it` | `/promotori` | Control Room, fee, Esci (prima OK, ora rotto) |

Anche: registrazione pubblica per ogni ruolo (`/registrati`); invito QR Laura resta **friend**; navigazione Esplora/Destinazioni/… da loggati senza perdere sessione.

## Fix suggeriti al ripresa

1. In `AfterHydration`: usare `fallback !== undefined ? fallback : default` (così `null` è vuoto, non il box).
2. Header: stesso markup server/client (niente placeholder diverso dal link).
3. Logout: una sola funzione stabile, senza cambiare gli export di `session-client` usati da fornitore/promotori/Mario.
4. Smoke test tabella ruoli sopra.

---

## ✅ Risolto (branch corrente)

Cause trovate e fix applicati:

1. **Hydration mismatch `HeaderMenu`** — causa: `AfterHydration` usava `fallback ?? default`,
   quindi `fallback={null}` veniva ignorato (`null ?? default` → box bianco `min-h-[16rem]`)
   e il primo paint server ≠ client. Fix in `src/components/after-hydration.tsx`:
   `fallback !== undefined ? fallback : default` → con `fallback={null}` il primo render
   (server **e** client) è `null`: markup identico, nessun mismatch, nessun box bianco.
   Verificato: l'header nell'HTML SSR non contiene né box né link utente.
2. **Logout instabile / "not a function"** — causa: tre copie diverse del logout
   (`leaveSession` inline in `header-menu.tsx`, onClick inline in `logout-button.tsx`,
   `logoutClient` in `session-client.ts` mai usata). Fix: unica funzione `logoutClient()`
   in `src/lib/session-client.ts`, usata da `header-menu.tsx` e `logout-button.tsx`.
   Invia il token anche come `?sid=` nella POST (`/api/auth/logout?sid=…`) via `apiFetch`,
   così il middleware trova sempre la sessione da distruggere anche senza cookie/headers.
3. **Sessione iframe `?sid=`** — `logoutClient` ora chiama `clearClientSession()` (flag
   `radici_logged_out` + storage + cookie + rimozione `sid` dall'URL) e poi redirect a `/login`;
   il server distrugge la riga in DB e cancella il cookie. Dopo il logout il vecchio `?sid=`
   non logga più (307 → `/login` sulle aree riservate; pagine pubbliche restano 200 anonime).

Smoke test ejecutado (dev server, password `radici2026`): per tutti e 6 i demo
(Mario, Luca, Luigi, Elena Martini CSR, Elena Conti fornitore, Chiara promotori)
login → area giusta 200 → logout → 307 a `/login` → re-login con nuova sessione → 200.
Registrazione pubblica OK per friend/employee/csr/provider/promoter. Typecheck OK, build OK.
