export const CLIENT_SESSION_KEY = "radici_session";
export const SESSION_HEADER = "x-radici-session";

function readStorage(storage: Storage) {
  try {
    return storage.getItem(CLIENT_SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(storage: Storage, token: string) {
  try {
    storage.setItem(CLIENT_SESSION_KEY, token);
  } catch {
    /* ignore */
  }
}

export function readClientSessionToken() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("sid");
  if (fromUrl) return fromUrl;
  return readStorage(window.sessionStorage) || readStorage(window.localStorage);
}

export function persistClientSession(token: string) {
  if (typeof window === "undefined" || !token) return;
  writeStorage(window.sessionStorage, token);
  writeStorage(window.localStorage, token);
  const secure = window.location.protocol === "https:";
  const parts = [`${CLIENT_SESSION_KEY}=${token}`, "Path=/", `Max-Age=${14 * 24 * 60 * 60}`];
  if (secure) parts.push("Secure", "SameSite=None", "Partitioned");
  else parts.push("SameSite=Lax");
  document.cookie = parts.join("; ");
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CLIENT_SESSION_KEY);
    window.localStorage.removeItem(CLIENT_SESSION_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${CLIENT_SESSION_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${CLIENT_SESSION_KEY}=; Path=/; Max-Age=0; Secure; SameSite=None`;
}

export function sessionHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const token = readClientSessionToken();
  if (token && !headers.has(SESSION_HEADER)) headers.set(SESSION_HEADER, token);
  return headers;
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
    headers: sessionHeaders(init.headers),
  });
}

let fetchPatched = false;

/** Runs in the browser bundle (no <script> in layout). Safe to call more than once. */
export function installClientSession() {
  if (typeof window === "undefined") return;
  const token = readClientSessionToken();
  if (token) persistClientSession(token);
  if (fetchPatched) return;
  fetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const nextInit: RequestInit = init ? { ...init } : {};
    nextInit.headers = sessionHeaders(nextInit.headers);
    if (!nextInit.credentials) nextInit.credentials = "include";
    return orig(input, nextInit);
  };
}
