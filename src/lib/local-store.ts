"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Pequeno "banco de dados" no navegador (localStorage), compartilhado entre
 * todas as telas que usam o mesmo `key`. Quando o valor muda, todas as
 * telas se atualizam juntas, inclusive em outras abas.
 *
 * `parse` recebe o JSON salvo (ou `null`) e devolve um valor válido,
 * completando campos que versões antigas não tinham.
 */
export function createLocalStore<T>(key: string, empty: T, parse: (saved: unknown) => T) {
  const changeEvent = `soma:change:${key}`;
  let cachedRaw: string | null | undefined;
  let cachedValue: T = empty;

  function readRaw(): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null; // navegação privada ou armazenamento bloqueado
    }
  }

  function read(): T {
    const raw = readRaw();
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    try {
      cachedValue = parse(raw ? JSON.parse(raw) : null);
    } catch {
      cachedValue = empty;
    }
    return cachedValue;
  }

  function write(value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sem espaço ou armazenamento bloqueado: a mudança vale só nesta sessão
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  function subscribe(onChange: () => void): () => void {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onChange();
    };
    window.addEventListener(changeEvent, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(changeEvent, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  const getServerValue = () => empty;
  const getReadyClient = () => true;
  const getReadyServer = () => false;

  /**
   * `ready` é falso na renderização do servidor e no primeiro desenho do
   * navegador, antes de o valor salvo ser lido.
   */
  function useStore() {
    const state = useSyncExternalStore(subscribe, read, getServerValue);
    const ready = useSyncExternalStore(subscribe, getReadyClient, getReadyServer);
    const update = useCallback((change: (current: T) => T) => write(change(read())), []);
    return { state, ready, update, replace: write };
  }

  return { useStore, read, write };
}
