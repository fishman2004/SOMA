/**
 * Conquistas: marcos de esforço e de aprendizagem.
 *
 * São calculadas a partir do progresso, sem nada guardado à parte: se as
 * regras mudarem, as conquistas se ajustam sozinhas. Premiam hábitos que
 * ajudam a aprender (refletir sobre o erro, corrigir, revisar com espaço),
 * nunca tempo de tela ou cliques.
 */
import { getErrorEntries, getTopicMastery, type ProgressState } from "./learning";

export interface TopicRef {
  id: string;
  questionIds: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira da semana
  return d.toDateString();
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Maior número de dias de estudo dentro de uma mesma semana (segunda a domingo). */
export function bestWeekStudyDays(state: ProgressState): number {
  const weeks = new Map<string, Set<string>>();
  for (const a of state.attempts) {
    const week = weekKey(a.at);
    if (!weeks.has(week)) weeks.set(week, new Set());
    weeks.get(week)!.add(dayKey(a.at));
  }
  return Math.max(0, ...[...weeks.values()].map((days) => days.size));
}

export function getAchievements(
  state: ProgressState,
  topics: TopicRef[],
  weeklyGoal: number,
): Achievement[] {
  const errors = getErrorEntries(state);
  const masteries = topics.map((t) => getTopicMastery(state, t.id, t.questionIds));

  return [
    {
      id: "primeiro-passo",
      title: "Primeiro passo",
      description: "Responder a primeira questão.",
      earned: state.attempts.length > 0,
    },
    {
      id: "erro-que-ensina",
      title: "Erro que ensina",
      description: "Registrar o que aconteceu em um erro.",
      earned: state.attempts.some((a) => a.cause !== undefined),
    },
    {
      id: "erro-corrigido",
      title: "Erro corrigido",
      description: "Acertar uma questão que você tinha errado.",
      earned: errors.some((e) => e.status === "resolvido"),
    },
    {
      id: "memoria-em-dia",
      title: "Memória em dia",
      description: "Levar um cartão de memória até a caixa 3.",
      earned: Object.values(state.cards).some((c) => c.box >= 3),
    },
    {
      id: "primeiro-simulado",
      title: "Primeiro simulado",
      description: "Concluir um simulado.",
      earned: state.exams.length > 0,
    },
    {
      id: "topico-consolidado",
      title: "Tópico consolidado",
      description: "Chegar a Consolidando em um tópico.",
      earned: masteries.some((m) => m.level === "consolidando" || m.level === "dominado"),
    },
    {
      id: "topico-dominado",
      title: "Tópico dominado",
      description: "Dominar um tópico: acertos em dias diferentes e nenhum erro pendente.",
      earned: masteries.some((m) => m.level === "dominado"),
    },
    {
      id: "semana-completa",
      title: "Semana completa",
      description: `Estudar ${weeklyGoal} dias em uma mesma semana.`,
      earned: bestWeekStudyDays(state) >= weeklyGoal,
    },
    {
      id: "trilha-percorrida",
      title: "Trilha percorrida",
      description: "Responder todas as questões da trilha pelo menos uma vez.",
      earned: masteries.length > 0 && masteries.every((m) => m.total > 0 && m.answered === m.total),
    },
  ];
}
