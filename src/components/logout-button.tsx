"use client";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void (async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          } finally {
            try {
              window.sessionStorage.setItem("radici_logged_out", "1");
              window.sessionStorage.removeItem("radici_session");
              window.localStorage.removeItem("radici_session");
            } catch {
              /* ignore */
            }
            document.cookie = "radici_session=; Path=/; Max-Age=0; SameSite=Lax";
            window.location.replace("/login");
          }
        })();
      }}
    >
      Esci
    </button>
  );
}
