"use client";

import { EMPTY_ESSAYS, normalizeEssays } from "./essay";
import { createLocalStore } from "./local-store";

/**
 * Redações ficam só neste navegador, separadas do progresso de estudo.
 * O estudante pode baixar cada uma como arquivo de texto.
 */
const essayStore = createLocalStore("soma:redacao:v1", EMPTY_ESSAYS, normalizeEssays);

export function useEssays() {
  return essayStore.useStore();
}
