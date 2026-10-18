"use client";

import { useCallback } from "react";
import { isProgressShape, normalizeProgress } from "./backup";
import { EMPTY_PROGRESS } from "./learning";
import { createLocalStore } from "./local-store";

/**
 * Onde o progresso fica guardado na v0.1: no próprio navegador
 * (localStorage). Nenhum dado pessoal sai do aparelho.
 *
 * Limitações conhecidas: o progresso não passa de um aparelho para
 * outro sozinho (há a cópia de segurança em Progresso) e some se o
 * estudante limpar os dados do navegador. Contas de usuário resolvem
 * isso numa versão futura.
 */
const progressStore = createLocalStore("soma:progress:v1", EMPTY_PROGRESS, (saved) =>
  // Progresso salvo por versões anteriores pode não ter os campos novos.
  isProgressShape(saved) ? normalizeProgress(saved) : EMPTY_PROGRESS,
);

/**
 * Lê e atualiza o progresso. Todas as telas que usam este hook
 * se atualizam juntas quando o progresso muda.
 */
export function useProgress() {
  const { state, ready, update, replace } = progressStore.useStore();
  const reset = useCallback(() => replace(EMPTY_PROGRESS), [replace]);
  return { state, ready, update, reset, replace };
}
