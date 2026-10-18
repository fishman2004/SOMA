/**
 * Cópia de segurança do progresso.
 *
 * O progresso fica só no navegador. Para não perder tudo ao trocar de
 * aparelho ou limpar o navegador, o estudante pode baixar um arquivo e
 * restaurá-lo depois. O arquivo não tem nenhum dado pessoal.
 */
import { EMPTY_PROGRESS, type ProgressState } from "./learning";

const APP = "soma";
const KIND = "progresso";

export function serializeBackup(state: ProgressState, exportedAt: Date = new Date()): string {
  return JSON.stringify({ app: APP, kind: KIND, exportedAt: exportedAt.toISOString(), data: state }, null, 2);
}

export function backupFileName(date: Date = new Date()): string {
  const d = date.toISOString().slice(0, 10);
  return `soma-progresso-${d}.json`;
}

/** Completa campos que versões antigas não tinham. */
export function normalizeProgress(value: Partial<ProgressState>): ProgressState {
  return {
    ...EMPTY_PROGRESS,
    ...value,
    version: 1,
    attempts: value.attempts ?? [],
    visitedTopics: value.visitedTopics ?? [],
    cards: value.cards ?? {},
    exams: value.exams ?? [],
    drills: value.drills ?? {},
    daily: value.daily ?? {},
    sheets: value.sheets ?? [],
  };
}

export function isProgressShape(value: unknown): value is Partial<ProgressState> & { version: 1 } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<ProgressState>;
  return v.version === 1 && Array.isArray(v.attempts) && Array.isArray(v.visitedTopics);
}

export type BackupResult = { ok: true; state: ProgressState } | { ok: false; error: string };

export function parseBackup(text: string): BackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "O arquivo não é uma cópia do SOMA (não foi possível ler o conteúdo)." };
  }
  const wrapper = parsed as { app?: unknown; kind?: unknown; data?: unknown };
  if (wrapper?.app !== APP || wrapper?.kind !== KIND) {
    return { ok: false, error: "Esse arquivo não é uma cópia de progresso do SOMA." };
  }
  if (!isProgressShape(wrapper.data)) {
    return { ok: false, error: "A cópia está incompleta ou foi alterada." };
  }
  const data = wrapper.data;
  const attemptsOk = data.attempts!.every(
    (a) => typeof a?.questionId === "string" && typeof a?.at === "string" && typeof a?.correct === "boolean",
  );
  if (!attemptsOk) return { ok: false, error: "A cópia está incompleta ou foi alterada." };
  return { ok: true, state: normalizeProgress(data) };
}
