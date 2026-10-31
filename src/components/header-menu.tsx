"use client";

import Link from "next/link";
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

export function HeaderMenu({ sessionToken = "", user }: Props) {
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
    setOpen(false);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      clearClientSession();
      window.location.replace("/login");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={accountHref}
            className="rounded-full bg-forest px-3.5 py-1.5 text-[13px] text-cream"
          >
            {user.firstName} {user.lastName}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-forest/15 px-3 py-1.5 text-[13px] text-olive hover:text-forest"
          >
            Esci
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="hidden rounded-full bg-forest px-4 py-1.5 text-[13px] text-cream md:inline-flex"
        >
          Accedi
        </Link>
      )}
      <button
        type="button"
        className="rounded-full p-2 md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label="Apri menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full border-b border-forest/10 bg-cream p-5 text-forest md:hidden">
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
                <button type="button" className="text-left text-olive" onClick={logout}>
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
