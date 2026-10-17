import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink, Chip } from "@/components/ui";
import { ReviewQuestion } from "@/components/views/ReviewQuestion";
import { getAllQuestions, getQuestion, getTopic } from "@/content";

export function generateStaticParams() {
  return getAllQuestions().map((q) => ({ questao: q.id }));
}

export const metadata: Metadata = { title: "Refazer questão" };

export default async function ReviewPage({ params }: PageProps<"/revisar/[questao]">) {
  const { questao } = await params;
  const question = getQuestion(questao);
  if (!question) notFound();
  const topic = getTopic(question.topicId);

  return (
    <AppShell>
      <BackLink href="/erros">Caderno de erros</BackLink>
      <div className="flex flex-col gap-2">
        <Chip tone="primary">{topic?.name}</Chip>
        <h1 className="font-display text-2xl font-bold">Refazendo um erro</h1>
      </div>
      <ReviewQuestion question={question} />
    </AppShell>
  );
}
