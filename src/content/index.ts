import matematicaData from "./data/matematica.json";
import redacaoData from "./data/redacao.json";
import tecnicasData from "./data/tecnicas.json";
import { getTwinGenerator, isTwinId, resolveTwin, TWIN_GENERATORS, type TwinGenerator } from "./twins";
import type { SearchEntry } from "@/lib/search";
import type { EssayGuide, Flashcard, Question, Subject, TechniqueText, Topic } from "./types";

export { isTwinId, makeTwin, randomSeed, type TwinGenerator } from "./twins";

export type * from "./types";

/**
 * Ponto único de acesso ao conteúdo. As telas nunca importam
 * os arquivos JSON diretamente: assim, trocar a origem dos dados
 * (por exemplo, para um banco) muda só este arquivo.
 */
const subjects: Subject[] = [matematicaData as Subject];

export const PILOT_SUBJECT_ID = "matematica";

export function getSubject(id: string = PILOT_SUBJECT_ID): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

export function getAllSubjects(): Subject[] {
  return subjects;
}

export function getTopics(subjectId: string = PILOT_SUBJECT_ID): Topic[] {
  const subject = getSubject(subjectId);
  if (!subject) return [];
  return [...subject.topics].sort((a, b) => a.order - b.order);
}

export function getTopic(topicId: string): Topic | undefined {
  for (const subject of subjects) {
    const topic = subject.topics.find((t) => t.id === topicId);
    if (topic) return topic;
  }
  return undefined;
}

export function getQuestionsForTopic(topicId: string): Question[] {
  return subjects.flatMap((s) => s.questions).filter((q) => q.topicId === topicId);
}

/** Também gera questões gêmeas a partir do id ("gemea:molde:semente"). */
export function getQuestion(questionId: string): Question | undefined {
  if (isTwinId(questionId)) return resolveTwin(questionId);
  return subjects.flatMap((s) => s.questions).find((q) => q.id === questionId);
}

export function getAllQuestions(): Question[] {
  return subjects.flatMap((s) => s.questions);
}

/** Um tópico está disponível quando tem explicação e pelo menos uma questão. */
export function isTopicAvailable(topic: Topic): boolean {
  return Boolean(topic.content) && getQuestionsForTopic(topic.id).length > 0;
}

export function getAllFlashcards(): Flashcard[] {
  const order = new Map(getAllSubjects().flatMap((s) => s.topics.map((t) => [t.id, t.order] as const)));
  return subjects
    .flatMap((s) => s.flashcards)
    .sort((a, b) => (order.get(a.topicId) ?? 0) - (order.get(b.topicId) ?? 0));
}

export function getFlashcardsForTopic(topicId: string): Flashcard[] {
  return getAllFlashcards().filter((c) => c.topicId === topicId);
}

export function getFlashcard(cardId: string): Flashcard | undefined {
  return getAllFlashcards().find((c) => c.id === cardId);
}

export function getQuestionIds(topicId: string): string[] {
  return getQuestionsForTopic(topicId).map((q) => q.id);
}

/** Tópicos disponíveis, na ordem da trilha, no formato usado pelas regras de aprendizagem. */
export function getAvailableTopicRefs(subjectId: string = PILOT_SUBJECT_ID) {
  return getTopics(subjectId)
    .filter(isTopicAvailable)
    .map((t) => ({ id: t.id, questionIds: getQuestionIds(t.id) }));
}

/* Técnicas de cálculo rápido (textos). */

export function getTechniquesIntro(): string {
  return tecnicasData.intro;
}

export function getTechniqueTexts(): TechniqueText[] {
  return tecnicasData.techniques as TechniqueText[];
}

export function getTechniqueText(id: string): TechniqueText | undefined {
  return getTechniqueTexts().find((t) => t.id === id);
}

/* Laboratório de redação. */

export function getEssayGuide(): EssayGuide {
  return redacaoData as EssayGuide;
}

/* Questões gêmeas. */

export function getTwinGenerators(topicId?: string): TwinGenerator[] {
  return topicId ? TWIN_GENERATORS.filter((g) => g.topicId === topicId) : TWIN_GENERATORS;
}

export function getTwinGeneratorById(id: string): TwinGenerator | undefined {
  return getTwinGenerator(id);
}

/** Molde que gera gêmeas de uma questão (fixa ou já gêmea). */
export function getTwinGeneratorFor(questionId: string): TwinGenerator | undefined {
  if (isTwinId(questionId)) return getTwinGenerator(questionId.split(":")[1]);
  return TWIN_GENERATORS.find((g) => g.sourceIds.includes(questionId));
}

/* Busca. */

/** Tudo o que pode ser encontrado na busca, já com o link de destino. */
export function getSearchEntries(): SearchEntry[] {
  const topicName = (id: string) => getTopic(id)?.name;
  const entries: SearchEntry[] = [
    { title: "Laboratório de redação", href: "/redacao", text: "Redação ENEM: escrever, contar linhas, competências, proposta de intervenção, autoavaliação, temas de treino" },
    { title: "Simulado", href: "/simulado", text: "Prova com cronômetro, questões misturadas e correção no final" },
    { title: "Desafio do dia", href: "/desafio", text: "3 questões por dia, iguais para todo mundo" },
    { title: "Provas oficiais", href: "/provas", text: "Provas anteriores do ENEM (INEP), cartão-resposta e correção pelo gabarito" },
    { title: "Mapa de habilidades", href: "/mapa", text: "O que já está firme e o que treinar agora" },
    { title: "Cartões de memória", href: "/cartoes", text: "Revisão espaçada, flashcards" },
    { title: "Caderno de erros", href: "/erros", text: "Refazer as questões erradas" },
  ].map((p) => ({ ...p, id: `pagina:${p.href}`, kind: "pagina" as const }));

  for (const topic of getTopics().filter(isTopicAvailable)) {
    const c = topic.content!;
    entries.push({
      id: `topico:${topic.id}`,
      kind: "topico",
      title: topic.name,
      text: [topic.description, c.keyIdea, ...c.formulas.map((f) => `${f.label}: ${f.expression}`), c.warning ?? ""].filter(Boolean).join(" · "),
      href: `/estudar/${topic.id}`,
    });
  }

  for (const t of getTechniqueTexts()) {
    entries.push({
      id: `tecnica:${t.id}`,
      kind: "tecnica",
      title: t.name,
      text: [t.nickname ?? "", t.tagline, t.when, t.why].join(" "),
      href: `/tecnicas/${t.id}`,
      context: "Técnicas de cálculo rápido",
    });
  }

  for (const g of TWIN_GENERATORS) {
    entries.push({
      id: `gemea:${g.id}`,
      kind: "gemea",
      title: g.name,
      text: "Questões infinitas: a mesma ideia com números novos a cada vez.",
      href: `/gemea/${g.id}`,
      context: topicName(g.topicId),
    });
  }

  for (const card of getAllFlashcards()) {
    entries.push({
      id: `cartao:${card.id}`,
      kind: "cartao",
      title: card.front,
      text: card.back,
      href: `/cartoes/${card.topicId}`,
      context: topicName(card.topicId),
    });
  }

  for (const q of getAllQuestions()) {
    entries.push({
      id: `questao:${q.id}`,
      kind: "questao",
      title: q.prompt,
      // Sem explicação nem resposta: a busca não entrega o gabarito.
      text: [q.statement, q.table?.caption ?? ""].join(" "),
      href: `/questao/${q.id}`,
      context: topicName(q.topicId),
    });
  }

  return entries;
}
