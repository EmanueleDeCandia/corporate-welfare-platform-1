import { GlobalResetButton } from "@/components/global-reset-button";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-forest/10 bg-[#12261e] text-[#fbf7f0]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-serif text-3xl tracking-[0.16em] text-[#fbf7f0]">RADICI</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#fbf7f0]/80">
            Il welfare aziendale che fa crescere il territorio. Le imprese finanziano soggiorni e
            cene KM 0, i dipendenti scoprono le destinazioni, gli amici pagano in locale e i
            fornitori incassano due canali: B2B e B2C.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#c29b38] font-semibold">Portale</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[#fbf7f0]/85">
            <Link href="/esplora" className="hover:text-[#c29b38] transition">Mappa e strutture</Link>
            <Link href="/destinazioni" className="hover:text-[#c29b38] transition">Macro-aree</Link>
            <Link href="/imprese" className="hover:text-[#c29b38] transition">Vetrina imprese ESG</Link>
            <Link href="/come-funziona" className="hover:text-[#c29b38] transition">Modello pay-per-use</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#c29b38] font-semibold">Circuiti</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[#fbf7f0]/85">
            <Link href="/account" className="hover:text-[#c29b38] transition">Portafoglio welfare</Link>
            <Link href="/login" className="hover:text-[#c29b38] transition">Accesso dipendente</Link>
            <Link href="/login" className="hover:text-[#c29b38] transition">Pannello fornitore</Link>
            <p className="text-[#fbf7f0]/60 text-xs mt-1">P.IVA imprese in fatturazione diretta</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#fbf7f0]/60 max-w-7xl mx-auto">
        <div>
          © {new Date().getFullYear()} RADICI · Certificati di impatto sociale territoriale · Italia
        </div>
        <GlobalResetButton className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-[#fbf7f0]/80 hover:bg-white/15 hover:text-white" />
      </div>
    </footer>
  );
}
