/**
 * Busca simples e local, sem servidor: ignora acentos e maiúsculas,
 * exige que todas as palavras da busca apareçam e dá mais peso ao título.
 */

export type SearchKind = "pagina" | "topico" | "tecnica" | "gemea" | "cartao" | "questao";

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  /** Texto pesquisável além do título. */
  text: string;
  href: string;
  /** Onde o item está (ex.: nome do tópico). */
  context?: string;
}

export interface SearchResult extends SearchEntry {
  score: number;
  /** Trecho do texto em volta da primeira palavra encontrada (vazio se só o título bateu). */
  snippet: string;
}

export const MIN_QUERY_LENGTH = 2;

/** Ordem dos tipos em caso de empate: o que ensina antes do que testa. */
const KIND_WEIGHT: Record<SearchKind, number> = { pagina: 6, topico: 5, tecnica: 4, gemea: 3, cartao: 2, questao: 1 };

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(query: string): string[] {
  return [...new Set(normalize(query).split(/[^a-z0-9%,.]+/).filter((t) => t.length > 0))];
}

/** true quando a palavra aparece no começo de alguma palavra do texto. */
function startsWord(haystack: string, token: string): boolean {
  let i = haystack.indexOf(token);
  while (i !== -1) {
    if (i === 0 || !/[a-z0-9]/.test(haystack[i - 1])) return true;
    i = haystack.indexOf(token, i + 1);
  }
  return false;
}

export function makeSnippet(text: string, query: string, radius = 60): string {
  const plain = text.replace(/\s+/g, " ").trim();
  // A normalização preserva o tamanho quando só remove acentos combinados,
  // então comparamos letra a letra numa versão sem acento do mesmo texto.
  const folded = Array.from(plain, (ch) => normalize(ch) || " ").join("");
  let at = -1;
  for (const t of tokens(query)) {
    const i = folded.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return "";
  const chars = Array.from(plain);
  const start = Math.max(0, at - radius);
  const end = Math.min(chars.length, at + radius);
  return `${start > 0 ? "…" : ""}${chars.slice(start, end).join("").trim()}${end < chars.length ? "…" : ""}`;
}

export function search(entries: SearchEntry[], query: string, limit = 30): SearchResult[] {
  const words = tokens(query);
  if (normalize(query).length < MIN_QUERY_LENGTH || words.length === 0) return [];

  const results: SearchResult[] = [];
  for (const entry of entries) {
    const title = normalize(entry.title);
    const body = normalize(`${entry.context ?? ""} ${entry.text}`);
    let score = 0;
    let inTitleOnly = true;
    let ok = true;
    for (const w of words) {
      if (title.includes(w)) score += startsWord(title, w) ? 10 : 6;
      else if (body.includes(w)) {
        score += startsWord(body, w) ? 3 : 1;
        inTitleOnly = false;
      } else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (title === normalize(query)) score += 20;
    results.push({ ...entry, score, snippet: inTitleOnly ? "" : makeSnippet(entry.text, query) });
  }

  return results
    .sort((a, b) => b.score - a.score || KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind] || a.title.localeCompare(b.title))
    .slice(0, limit);
}
