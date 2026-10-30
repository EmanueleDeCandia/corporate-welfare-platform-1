export const SESSION_COOKIE = "radici_session";
export const SESSION_HEADER = "x-radici-session";
export const SESSION_DAYS = 14;

function firstHeader(h: Headers, name: string) {
  return (h.get(name) ?? "").split(",")[0]?.trim() ?? "";
}

export function isHttpsRequest(h: Headers) {
  const proto = firstHeader(h, "x-forwarded-proto").toLowerCase();
  const host = firstHeader(h, "x-forwarded-host").toLowerCase() || firstHeader(h, "host").toLowerCase();
  const origin = (h.get("origin") ?? "").toLowerCase();
  const referer = (h.get("referer") ?? "").toLowerCase();
  const forwarded = (h.get("forwarded") ?? "").toLowerCase();
  return (
    proto === "https" ||
    forwarded.includes("proto=https") ||
    origin.startsWith("https://") ||
    referer.startsWith("https://") ||
    host.includes("e2b.app") ||
    process.env.NODE_ENV === "production"
  );
}

export function publicOriginFromHeaders(h: Headers, fallbackUrl?: string) {
  const origin = h.get("origin");
  if (origin && origin.startsWith("http")) return origin.replace(/\/$/, "");
  const referer = h.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }
  const host = firstHeader(h, "x-forwarded-host") || firstHeader(h, "host");
  if (host) {
    const proto = isHttpsRequest(h) ? "https" : firstHeader(h, "x-forwarded-proto") || "http";
    return `${proto}://${host}`;
  }
  if (fallbackUrl) return new URL(fallbackUrl).origin;
  return "";
}

export function cookieOptionsFromHeaders(h: Headers) {
  const secure = isHttpsRequest(h);
  return {
    httpOnly: true as const,
    path: "/",
    secure,
    sameSite: (secure ? "none" : "lax") as "lax" | "none",
    partitioned: secure,
  };
}

/** Keep the session token in the URL: Arena iframes often drop cookies on client navigations. */
export function pathWithSession(path: string, token?: string | null) {
  if (!token) return path;
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = base.indexOf("?");
  const pathname = queryIndex >= 0 ? base.slice(0, queryIndex) : base;
  const query = queryIndex >= 0 ? base.slice(queryIndex + 1) : "";
  const params = new URLSearchParams(query);
  params.set("sid", token);
  return `${pathname}?${params.toString()}${hash}`;
}
