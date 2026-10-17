"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, type ProgressState } from "./learning";

/**
 * Onde o progresso fica guardado na v0.1: no próprio navegador
 * (localStorage). Nenhum dado pessoal sai do aparelho.
 *
 * Limitações conhecidas: o progresso não passa de um aparelho para
 * outro e some se o estudante limpar os dados do navegador. Contas
 * de usuário resolvem isso numa versão futura.
 */
const STORAGE_KEY = "soma:progress:v1";
const CHANGE_EVENT = "soma:progress-change";

let cachedRaw: string | null | undefined;
let cachedState: ProgressState = EMPTY_PROGRESS;

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<ProgressState>;
  return v.version === 1 && Array.isArray(v.attempts) && Array.isArray(v.visitedTopics);
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Navegação privada ou armazenamento bloqueado.
    return null;
  }
}

function getSnapshot(): ProgressState {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    // Progresso salvo por versões anteriores pode não ter `cards` ou `exams`.
    cachedState = isProgressState(parsed)
      ? { ...parsed, cards: parsed.cards ?? {}, exams: parsed.exams ?? [] }
      : EMPTY_PROGRESS;
  } catch {
    cachedState = EMPTY_PROGRESS;
  }
  return cachedState;
}

function getServerSnapshot(): ProgressState {
  return EMPTY_PROGRESS;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage); // mudanças vindas de outra aba
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function write(state: ProgressState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem espaço ou armazenamento bloqueado: o progresso desta sessão não é salvo.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Lê e atualiza o progresso. Todas as telas que usam este hook
 * se atualizam juntas quando o progresso muda.
 *
 * `ready` é falso na renderização do servidor e no primeiro desenho
 * do navegador, antes de o progresso salvo ser lido.
 */
export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const update = useCallback((change: (current: ProgressState) => ProgressState) => {
    write(change(getSnapshot()));
  }, []);

  const reset = useCallback(() => write(EMPTY_PROGRESS), []);

  return { state, ready, update, reset };
}
