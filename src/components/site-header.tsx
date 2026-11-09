import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { HeaderMenu } from "@/components/header-menu";

export async function SiteHeader({ dark = false }: { dark?: boolean }) {
  const user = await getCurrentUser();

  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        dark
          ? "border-white/10 bg-forest-deep/80 text-cream backdrop-blur-xl"
          : "border-forest/10 bg-paper/80 text-forest backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <img src="/images/logo.png" alt="RADICI" className="h-11 w-11 rounded-full object-cover" />
          <span className="leading-none">
            <span className="font-serif text-xl tracking-[0.14em]">RADICI</span>
            <span className={`block text-[10px] uppercase tracking-[0.22em] ${dark ? "text-gold" : "text-olive"}`}>
              Welfare territoriale
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/esplora" className="hover:text-terracotta">
            Esplora
          </Link>
          <Link href="/destinazioni" className="hover:text-terracotta">
            Destinazioni
          </Link>
          <Link href="/strutture" className="hover:text-terracotta">
            Strutture
          </Link>
          <Link href="/imprese" className="hover:text-terracotta">
            Aziende Shared Value
          </Link>
          <Link href="/come-funziona" className="hover:text-terracotta">
            Come funziona
          </Link>
          <Link href="/account/certificati" className="hover:text-terracotta inline-flex items-center gap-1 font-semibold text-forest">
            <Sparkles size={13} className="text-gold" />
            Attestati d&apos;Impatto
          </Link>
          <Link href="/torneo" className="hover:text-terracotta inline-flex items-center gap-1 font-semibold text-terracotta">
            <Sparkles size={13} className="text-gold" />
            Torneo Trailer
          </Link>
        </nav>
        <HeaderMenu
          dark={dark}
          user={
            user
              ? {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role,
                  impactPoints: user.impactPoints,
                }
              : null
          }
        />
      </div>
    </header>
  );
}
