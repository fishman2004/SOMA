/**
 * Regras comuns de resposta para todos os formatos de questão.
 * A tentativa guarda a resposta como texto (`Attempt.chosenId`):
 * a letra, na múltipla escolha, ou o número normalizado, na numérica.
 */
import type { Question } from "@/content";
import { formatWithUnit, isNumericAnswerCorrect, parseNumber } from "./numeric-answer";

export function isAnswerCorrect(question: Question, given: string): boolean {
  if (question.kind === "numerica") {
    const value = parseNumber(given);
    return value !== null && isNumericAnswerCorrect(value, question.answer, question.tolerance);
  }
  return given === question.correctId;
}

/** Como a resposta correta aparece para o estudante. */
export function correctAnswerText(question: Question): string {
  if (question.kind === "numerica") return formatWithUnit(question.answer, question.prefix, question.unit);
  const alt = question.alternatives.find((a) => a.id === question.correctId);
  return alt ? `${alt.id}) ${alt.text}` : question.correctId;
}

/** Como a resposta dada aparece para o estudante. */
export function givenAnswerText(question: Question, given: string): string {
  if (question.kind === "numerica") {
    const value = parseNumber(given);
    return value === null ? given : formatWithUnit(value, question.prefix, question.unit);
  }
  const alt = question.alternatives.find((a) => a.id === given);
  return alt ? `${alt.id}) ${alt.text}` : given;
}

/** Explicação do erro específico cometido, quando ele é um erro previsto. */
export function mistakeExplanation(question: Question, given: string): string | undefined {
  if (question.kind === "numerica") {
    const value = parseNumber(given);
    if (value === null) return undefined;
    return question.commonMistakes?.find((m) => isNumericAnswerCorrect(value, m.value, question.tolerance))
      ?.explanation;
  }
  return question.trap?.alternativeId === given ? question.trap.explanation : undefined;
}
