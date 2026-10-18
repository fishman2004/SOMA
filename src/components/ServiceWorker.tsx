"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Registra o service worker (só na versão de produção, para não atrapalhar o desenvolvimento). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem service worker o app funciona normalmente, só não funciona offline.
    });
  }, []);
  return null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Faixa discreta avisando que o aparelho está sem internet. */
export function OfflineBanner() {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-30 bg-inverse px-4 py-2 text-center text-sm text-on-inverse"
    >
      Sem internet. As telas que você já abriu continuam funcionando e seu progresso está salvo.
    </div>
  );
}
