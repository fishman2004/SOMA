/**
 * Laboratório de redação: regras puras (sem interface).
 * O SOMA não dá nota automática. Ele mede o texto (palavras, parágrafos,
 * linhas estimadas) e guarda a autoavaliação do próprio estudante.
 */

export const COMPETENCIES = [1, 2, 3, 4, 5] as const;
export type Competency = (typeof COMPETENCIES)[number];

/** Níveis de 0 a 5 por competência; cada nível vale 40 pontos (0 a 200). */
export const LEVEL_POINTS = 40;
export const MAX_LEVEL = 5;

/** Folha oficial: 30 linhas. Texto com até 7 linhas é considerado insuficiente. */
export const SHEET_LINES = 30;
export const MIN_LINES = 8;

/** Média de caracteres numa linha manuscrita da folha (estimativa). */
export const CHARS_PER_LINE = 72;

export interface EssayDraft {
  id: string;
  theme: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  /** Tempo de escrita cronometrado, em segundos. */
  seconds: number;
  /** Nível que o estudante se deu em cada competência (0 a 5). */
  levels: Partial<Record<Competency, number>>;
  /** Itens da lista de conferência marcados pelo estudante. */
  checked: string[];
}

export interface EssayState {
  version: 1;
  drafts: EssayDraft[];
}

export const EMPTY_ESSAYS: EssayState = { version: 1, drafts: [] };

export interface TextStats {
  words: number;
  characters: number;
  paragraphs: number;
  /** Estimativa de linhas na folha: cada parágrafo começa numa linha nova. */
  lines: number;
}

export function getTextStats(text: string): TextStats {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
  const words = paragraphs.reduce((sum, p) => sum + p.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length, 0);
  const characters = paragraphs.reduce((sum, p) => sum + p.length, 0);
  // Recuo de parágrafo ocupa ~4 caracteres na linha manuscrita.
  const lines = paragraphs.reduce((sum, p) => sum + Math.ceil((p.length + 4) / CHARS_PER_LINE), 0);
  return { words, characters, paragraphs: paragraphs.length, lines };
}

export type LengthStatus = "vazio" | "insuficiente" | "curto" | "bom" | "acima";

/**
 * - insuficiente: até 7 linhas (pela regra do ENEM, vale zero);
 * - curto: menos de 20 linhas (costuma faltar desenvolvimento);
 * - bom: de 20 a 30 linhas;
 * - acima: passa de 30 linhas e não caberia na folha.
 */
export function getLengthStatus(lines: number): LengthStatus {
  if (lines === 0) return "vazio";
  if (lines < MIN_LINES) return "insuficiente";
  if (lines < 20) return "curto";
  if (lines <= SHEET_LINES) return "bom";
  return "acima";
}

/** Soma da autoavaliação (0 a 1000), ou undefined se faltar alguma competência. */
export function getSelfScore(levels: EssayDraft["levels"]): number | undefined {
  let total = 0;
  for (const c of COMPETENCIES) {
    const level = levels[c];
    if (level === undefined) return undefined;
    total += level * LEVEL_POINTS;
  }
  return total;
}

export function createDraft(id: string, at: string, theme = ""): EssayDraft {
  return { id, theme, text: "", createdAt: at, updatedAt: at, seconds: 0, levels: {}, checked: [] };
}

export function upsertDraft(state: EssayState, draft: EssayDraft): EssayState {
  const others = state.drafts.filter((d) => d.id !== draft.id);
  return { ...state, drafts: [draft, ...others] };
}

export function updateDraft(
  state: EssayState,
  id: string,
  change: Partial<Omit<EssayDraft, "id" | "createdAt">>,
  at: string,
): EssayState {
  const current = state.drafts.find((d) => d.id === id);
  if (!current) return state;
  return {
    ...state,
    drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...change, updatedAt: at } : d)),
  };
}

export function deleteDraft(state: EssayState, id: string): EssayState {
  return { ...state, drafts: state.drafts.filter((d) => d.id !== id) };
}

/** Rascunhos do mais recente para o mais antigo. */
export function sortDrafts(drafts: EssayDraft[]): EssayDraft[] {
  return [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Lê o que está salvo, descartando o que estiver malformado. */
export function normalizeEssays(saved: unknown): EssayState {
  if (!isRecord(saved) || !Array.isArray(saved.drafts)) return EMPTY_ESSAYS;
  const drafts: EssayDraft[] = [];
  for (const d of saved.drafts) {
    if (!isRecord(d) || typeof d.id !== "string" || typeof d.text !== "string") continue;
    const levels: EssayDraft["levels"] = {};
    if (isRecord(d.levels)) {
      for (const c of COMPETENCIES) {
        const v = d.levels[c];
        if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= MAX_LEVEL) levels[c] = v;
      }
    }
    const at = typeof d.updatedAt === "string" ? d.updatedAt : "1970-01-01T00:00:00.000Z";
    drafts.push({
      id: d.id,
      theme: typeof d.theme === "string" ? d.theme : "",
      text: d.text,
      createdAt: typeof d.createdAt === "string" ? d.createdAt : at,
      updatedAt: at,
      seconds: typeof d.seconds === "number" && d.seconds >= 0 ? Math.floor(d.seconds) : 0,
      levels,
      checked: Array.isArray(d.checked) ? d.checked.filter((x): x is string => typeof x === "string") : [],
    });
  }
  return { version: 1, drafts };
}

/** Texto para baixar como arquivo .txt. */
export function draftToText(draft: EssayDraft): string {
  const title = draft.theme.trim() ? `Tema: ${draft.theme.trim()}\n\n` : "";
  return `${title}${draft.text.trim()}\n`;
}
