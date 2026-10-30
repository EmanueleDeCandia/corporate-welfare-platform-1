"use client";

import { useEffect } from "react";
import { installClientSession, persistClientSession, readClientSessionToken } from "@/lib/session-client";

installClientSession();

function hrefWithSid(href: string, token: string) {
  const url = new URL(href, window.location.origin);
  url.searchParams.set("sid", token);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function SessionBootstrap() {
  useEffect(() => {
    installClientSession();
    const token = readClientSessionToken();
    if (token) {
      persistClientSession(token);
      const current = new URL(window.location.href);
      if (current.searchParams.get("sid") !== token) {
        current.searchParams.set("sid", token);
        window.history.replaceState(window.history.state, "", `${current.pathname}${current.search}${current.hash}`);
      }
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor || (anchor.target && anchor.target !== "_self")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/api/")) return;
      const sid = readClientSessionToken();
      if (!sid) return;
      if (url.searchParams.get("sid") === sid) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(hrefWithSid(url.href, sid));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
