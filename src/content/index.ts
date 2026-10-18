import matematicaData from "./data/matematica.json";
import tecnicasData from "./data/tecnicas.json";
import { getTwinGenerator, isTwinId, resolveTwin, TWIN_GENERATORS, type TwinGenerator } from "./twins";
import type { Flashcard, Question, Subject, TechniqueText, Topic } from "./types";

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
