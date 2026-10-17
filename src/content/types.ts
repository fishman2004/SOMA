/**
 * Modelo de conteúdo do SOMA.
 *
 * O conteúdo vive em arquivos JSON dentro de `src/content/data/`.
 * Assim ele pode ser revisado e versionado no Git e, mais tarde,
 * importado para um banco de dados sem mudar as telas.
 */

/** De onde veio o conteúdo. Nunca apresentar como oficial sem confirmação. */
export type ContentOrigin =
  | "soma" // produzido pela equipe do SOMA
  | "inep" // prova ou gabarito oficial do INEP (exige referência)
  | "externo"; // material de terceiros (exige licença e link)

/** Situação editorial do conteúdo. */
export type ReviewStatus =
  | "rascunho" // ainda sendo escrito
  | "aguardando-revisao" // pronto, mas sem revisão humana
  | "revisado"; // revisado por uma pessoa

export interface Source {
  origin: ContentOrigin;
  /** Texto curto de atribuição, ex.: "Questão autoral do SOMA". */
  label: string;
  /** Link para a fonte original, quando houver. */
  url?: string;
  /** Licença ou condição de uso, quando houver. */
  license?: string;
  reviewStatus: ReviewStatus;
}

export interface Formula {
  label: string;
  expression: string;
}

export interface WorkedExample {
  statement: string;
  solution: string;
}

export interface Alternative {
  /** Letra exibida: A, B, C, D ou E. */
  id: string;
  text: string;
}

/** Tabela de dados exibida junto ao enunciado. */
export interface DataTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

/** Campos comuns a todos os formatos de questão. */
interface QuestionBase {
  id: string;
  topicId: string;
  statement: string;
  /** Tabela opcional com os dados do problema. */
  table?: DataTable;
  /** Pergunta final, exibida em destaque após o enunciado. */
  prompt: string;
  difficulty: "facil" | "media" | "dificil";
  /** Linhas do raciocínio, exibidas na ordem. */
  reasoning: string[];
  /** Fechamento curto que explica o resultado. */
  explanation: string;
  source: Source;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  kind: "multipla-escolha";
  alternatives: Alternative[];
  correctId: string;
  /** Erro comum ligado a uma alternativa incorreta. */
  trap?: {
    alternativeId: string;
    explanation: string;
  };
}

/** O estudante digita um número. Evita o chute e treina o cálculo de verdade. */
export interface NumericQuestion extends QuestionBase {
  kind: "numerica";
  answer: number;
  /** Diferença aceita em relação à resposta (padrão: 0). */
  tolerance?: number;
  /** Texto antes do campo, ex.: "R$". */
  prefix?: string;
  /** Unidade depois do campo, ex.: "m", "dias". */
  unit?: string;
  /** Respostas erradas previsíveis, com explicação específica para cada uma. */
  commonMistakes?: { value: number; explanation: string }[];
}

export type Question = MultipleChoiceQuestion | NumericQuestion;

export interface TopicContent {
  keyIdea: string;
  formulas: Formula[];
  warning?: string;
  example?: WorkedExample;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  /** Posição sugerida na trilha (1 = primeiro). */
  order: number;
  /** Ausente quando o tópico ainda está em preparação. */
  content?: TopicContent;
  source?: Source;
}

/** Cartão de memória: uma pergunta curta e sua resposta. */
export interface Flashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  source: Source;
}

export interface Subject {
  id: string;
  name: string;
  area: string;
  topics: Topic[];
  questions: Question[];
  flashcards: Flashcard[];
}
