import Link from "next/link";
import { getCurrentUser, getSessionToken, pathWithSession } from "@/lib/auth";
import { HeaderMenu } from "@/components/header-menu";
import { Mark } from "@/components/brand-mark";

export async function SiteHeader({ dark = false }: { dark?: boolean }) {
  const user = await getCurrentUser();
  const token = user ? await getSessionToken() : "";
  const href = (path: string) => pathWithSession(path, token);

  return (
    <header className="sticky top-0 z-40 border-b border-forest/8 bg-cream/85 text-forest backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Link href={href("/")} className="flex items-center gap-2.5">
          <Mark className="h-8 w-8" />
          <span className="font-serif text-[22px] tracking-[0.08em]">RADICI</span>
        </Link>
        <nav className="hidden items-center gap-4 whitespace-nowrap text-[12px] text-olive md:flex lg:gap-6 lg:text-[13px]">
          <Link href={href("/esplora")} className="hover:text-forest">
            Esplora
          </Link>
          <Link href={href("/destinazioni")} className="hover:text-forest">
            Destinazioni
          </Link>
          <Link href={href("/strutture")} className="hover:text-forest">
            <span className="lg:hidden">Strutture</span>
            <span className="hidden lg:inline">Strutture e Tipicità KM 0</span>
          </Link>
          <Link href={href("/imprese")} className="hover:text-forest">
            Imprese
          </Link>
          <Link href={href("/vantaggi")} className="hover:text-forest">
            Valore Condiviso
          </Link>
          <Link href={href("/come-funziona")} className="hover:text-forest">
            Come funziona
          </Link>
        </nav>
        <HeaderMenu
          dark={dark}
          sessionToken={token}
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
