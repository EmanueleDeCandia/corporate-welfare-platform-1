import { GlobalResetButton } from "@/components/global-reset-button";
import Link from "next/link";
import { getSessionToken, pathWithSession } from "@/lib/auth";
import { Mark } from "@/components/brand-mark";

export async function SiteFooter() {
  const token = await getSessionToken();
  const href = (path: string) => pathWithSession(path, token);
  return (
    <footer className="mt-8">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <Mark className="h-8 w-8" />
            <p className="font-serif text-2xl tracking-[0.08em]">RADICI</p>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-olive">
            Il welfare aziendale che fa crescere il territorio. Le imprese finanziano soggiorni e
            cene KM 0, i dipendenti scoprono le destinazioni, gli amici pagano in locale.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-olive">Portale</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-forest">
            <Link href={href("/esplora")} className="hover:text-olive">
              Mappa e strutture
            </Link>
            <Link href={href("/destinazioni")} className="hover:text-olive">
              Macro-aree
            </Link>
            <Link href={href("/imprese")} className="hover:text-olive">
              Vetrina imprese ESG
            </Link>
            <Link href={href("/come-funziona")} className="hover:text-olive">
              Come funziona
            </Link>
            <Link href={href("/vantaggi")} className="hover:text-olive">
              I vantaggi della partecipazione
            </Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-olive">Circuiti</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-forest">
            <Link href={href("/account")} className="hover:text-olive">
              Portafoglio welfare
            </Link>
            <Link href="/login" className="hover:text-olive">
              Accedi
            </Link>
            <Link href="/registrati" className="hover:text-olive">
              Crea un account
            </Link>
            <p className="mt-1 text-xs text-olive">P.IVA imprese in fatturazione diretta</p>
          </div>
        </div>
      </div>
      <div className="relative h-[280px] overflow-hidden md:h-[360px]">
        <img
          src="/images/footer-landscape.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-olive max-w-6xl mx-auto">
        <div>© 2026 RADICI · Certificati di impatto sociale territoriale · Italia</div>
        <GlobalResetButton className="rounded-full border border-forest/15 px-3 py-1.5 text-xs text-olive hover:bg-white" />
      </div>
    </footer>
  );
}
