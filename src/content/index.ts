import matematicaData from "./data/matematica.json";
import type { Question, Subject, Topic } from "./types";

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

export function getQuestion(questionId: string): Question | undefined {
  return subjects.flatMap((s) => s.questions).find((q) => q.id === questionId);
}

export function getAllQuestions(): Question[] {
  return subjects.flatMap((s) => s.questions);
}

/** Um tópico está disponível quando tem explicação e pelo menos uma questão. */
export function isTopicAvailable(topic: Topic): boolean {
  return Boolean(topic.content) && getQuestionsForTopic(topic.id).length > 0;
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
