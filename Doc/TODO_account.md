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
