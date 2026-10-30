"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { apiFetch, clearClientSession } from "@/lib/session-client";
import { pathWithSession } from "@/lib/session-cookie";

type Props = {
  dark?: boolean;
  sessionToken?: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
    impactPoints: number;
  } | null;
};

export function HeaderMenu({ dark, sessionToken = "", user }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const href = (path: string) => pathWithSession(path, sessionToken);
  const accountHref =
    user?.role === "provider"
      ? href("/fornitore")
      : user?.role === "csr"
        ? href("/azienda")
        : user?.role === "promoter" || user?.role === "admin"
          ? href("/promotori")
          : href("/account");

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearClientSession();
      setOpen(false);
      router.push("/");
      router.refresh();
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
          {user.role === "csr" ? (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-gold">CSR Manager</span>
          ) : user.role !== "provider" ? (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-gold">
              {user.impactPoints} pt
            </span>
          ) : (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] text-gold">Fornitore</span>
          )}
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
            <Link href={href("/esplora")} onClick={() => setOpen(false)}>
              Esplora
            </Link>
            <Link href={href("/destinazioni")} onClick={() => setOpen(false)}>
              Destinazioni
            </Link>
            <Link href={href("/strutture")} onClick={() => setOpen(false)}>
              Strutture
            </Link>
            <Link href={href("/imprese")} onClick={() => setOpen(false)}>
              Imprese ESG
            </Link>
            <Link href={href("/come-funziona")} onClick={() => setOpen(false)}>
              Come funziona
            </Link>
            {user ? (
              <>
                <Link href={accountHref} onClick={() => setOpen(false)}>
                  Area riservata
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
