"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type Props = {
  dark?: boolean;
  user: {
    firstName: string;
    lastName: string;
    role: string;
    impactPoints: number;
  } | null;
};

export function HeaderMenu({ dark, user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Smistamento rigoroso dei link alle aree riservate in base al ruolo
  const accountHref = 
    user?.role === "promoter" || user?.role === "admin"
      ? "/promotori"
      : user?.role === "theater"
        ? "/teatro"
        : user?.role === "csr"
          ? "/azienda"
          : user?.role === "provider"
            ? "/fornitore"
            : "/account";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  function renderRoleBadge() {
    if (!user) return null;
    switch (user.role) {
      case "promoter":
      case "admin":
        return <span className="rounded-full bg-gold/25 px-2.5 py-0.5 text-[11px] font-semibold text-gold">Startup Promotrice</span>;
      case "theater":
        return <span className="rounded-full bg-terracotta/25 px-2.5 py-0.5 text-[11px] font-semibold text-terracotta">Teatro & Eventi</span>;
      case "csr":
        return <span className="rounded-full bg-gold/25 px-2.5 py-0.5 text-[11px] font-semibold text-gold">CSR Manager</span>;
      case "provider":
        return <span className="rounded-full bg-gold/25 px-2.5 py-0.5 text-[11px] font-semibold text-gold">Fornitore</span>;
      case "employee":
        return <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-gold">Welfare · {user.impactPoints} pt</span>;
      case "friend":
      default:
        return <span className="rounded-full bg-sage/30 px-2 py-0.5 text-[11px] text-sand">Community · {user.impactPoints} pt</span>;
    }
  }

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <Link
          href={accountHref}
          className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm md:flex ${
            dark ? "bg-white/10 text-cream" : "bg-forest text-cream"
          }`}
        >
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>
          {renderRoleBadge()}
        </Link>
      ) : (
        <Link
          href="/login"
          className={`hidden rounded-full px-4 py-2 text-sm font-medium md:inline-flex ${
            dark ? "bg-cream text-forest" : "bg-forest text-cream"
          }`}
        >
          Accedi
        </Link>
      )}
      <button
        type="button"
        className={`rounded-full p-2 md:hidden ${dark ? "bg-white/10" : "bg-forest/5"}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Apri menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full border-b border-forest/10 bg-paper p-4 text-forest shadow-xl md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/esplora" onClick={() => setOpen(false)}>
              Esplora
            </Link>
            <Link href="/destinazioni" onClick={() => setOpen(false)}>
              Destinazioni
            </Link>
            <Link href="/strutture" onClick={() => setOpen(false)}>
              Strutture
            </Link>
            <Link href="/imprese" onClick={() => setOpen(false)}>
              Imprese ESG
            </Link>
            <Link href="/come-funziona" onClick={() => setOpen(false)}>
              Come funziona
            </Link>
            {user ? (
              <>
                <Link href={accountHref} onClick={() => setOpen(false)}>
                  Area riservata ({user.role === "promoter" ? "Startup Promotrice" : user.role === "theater" ? "Teatro & Eventi" : user.role === "csr" ? "CSR Azienda" : user.role === "provider" ? "Fornitore" : user.role === "employee" ? "Welfare" : "Community"})
                </Link>
                <button type="button" className="text-left text-terracotta" onClick={logout}>
                  Esci
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                Accedi
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
