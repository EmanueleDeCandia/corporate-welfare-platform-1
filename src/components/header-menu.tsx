"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AfterHydration } from "@/components/after-hydration";
import { pathWithSession } from "@/lib/session-cookie";
import { logoutClient } from "@/lib/session-client";

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

function leaveSession() {
  void logoutClient();
}

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

  return (
    <div className="flex items-center gap-2">
      <AfterHydration fallback={null}>
        {user ? (
          <>
            <Link
              href={accountHref}
              className="hidden items-center gap-2 rounded-full bg-forest px-3.5 py-1.5 text-[13px] text-cream lg:flex"
            >
              {user.firstName} {user.lastName}
            </Link>
            <button
              type="button"
              onClick={leaveSession}
              className="hidden rounded-full border border-forest/15 px-3 py-1.5 text-[13px] text-olive hover:text-forest lg:inline-flex"
            >
              Esci
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="hidden rounded-full bg-forest px-4 py-1.5 text-[13px] text-cream lg:inline-flex"
          >
            Accedi
          </Link>
        )}
      </AfterHydration>
      <button
        type="button"
        className="rounded-full p-2 lg:hidden"
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
              Strutture e Tipicità KM 0
            </Link>
            <Link href={href("/imprese")} onClick={() => setOpen(false)}>
              Imprese ESG
            </Link>
            <Link href={href("/vantaggi")} onClick={() => setOpen(false)}>
              Valore Condiviso
            </Link>
            <Link href={href("/come-funziona")} onClick={() => setOpen(false)}>
              Come funziona
            </Link>
            {user ? (
              <>
                <Link href={accountHref} onClick={() => setOpen(false)}>
                  Area riservata
                </Link>
                <button
                  type="button"
                  className="text-left text-olive"
                  onClick={() => {
                    setOpen(false);
                    leaveSession();
                  }}
                >
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
