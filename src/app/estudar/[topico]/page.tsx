import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink, Card, PageTitle, SectionTitle, SourceBadge } from "@/components/ui";
import { TopicAction, TopicSteps } from "@/components/views/TopicProgress";
import { getTopic, getTopics, isTopicAvailable } from "@/content";

export function generateStaticParams() {
  return getTopics().map((t) => ({ topico: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/estudar/[topico]">): Promise<Metadata> {
  const { topico } = await params;
  return { title: getTopic(topico)?.name ?? "Tópico" };
}

export default async function TopicPage({ params }: PageProps<"/estudar/[topico]">) {
  const { topico } = await params;
  const topic = getTopic(topico);
  if (!topic) notFound();

  if (!isTopicAvailable(topic) || !topic.content) {
    return (
      <AppShell nav="estudar">
        <BackLink href="/estudar">Trilha de Matemática</BackLink>
        <PageTitle title={topic.name} intro={topic.description} />
        <Card>
          <SectionTitle>Em preparação</SectionTitle>
          <p className="leading-relaxed">
            Este tópico ainda está sendo escrito e revisado. Enquanto isso, você pode praticar os tópicos
            disponíveis na trilha.
          </p>
        </Card>
      </AppShell>
    );
  }

  const { content } = topic;

  return (
    <AppShell footer={<TopicAction topicId={topic.id} />}>
      <BackLink href="/estudar">Trilha de Matemática</BackLink>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] font-bold leading-tight">{topic.name}</h1>
        {topic.source ? <SourceBadge source={topic.source} /> : null}
      </div>

      <TopicSteps topicId={topic.id} />

      <Card className="gap-3 p-[18px]">
        <SectionTitle>Ideia-chave</SectionTitle>
        <p className="text-base leading-normal">{content.keyIdea}</p>
        <ul className="flex flex-col gap-2">
          {content.formulas.map((f) => (
            <li key={f.label} className="flex flex-col gap-0.5 rounded-xl bg-primary-soft px-3.5 py-3">
              <span className="text-[13px] font-bold text-primary-strong">{f.label}</span>
              <span className="font-display text-lg font-medium">{f.expression}</span>
            </li>
          ))}
        </ul>
        {content.warning ? (
          <p className="rounded-xl bg-error-soft px-3.5 py-3 text-[15px] leading-snug text-error-strong">
            <strong>Atenção:</strong> {content.warning}
          </p>
        ) : null}
      </Card>

      {content.example ? (
        <Card className="gap-2 p-[18px]">
          <SectionTitle>Exemplo resolvido</SectionTitle>
          <p className="text-base leading-normal">{content.example.statement}</p>
          <p className="font-display text-[17px] font-bold">{content.example.solution}</p>
        </Card>
      ) : null}
    </AppShell>
  );
}
