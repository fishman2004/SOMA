import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink, Card, PageTitle, SectionTitle, SourceBadge } from "@/components/ui";
import { TopicAction, TopicSteps } from "@/components/views/TopicProgress";
import Link from "next/link";
import { CardsIcon, ChevronRightIcon, SparkIcon } from "@/components/icons";
import { getFlashcardsForTopic, getTopic, getTopics, isTopicAvailable } from "@/content";

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
  const cardCount = getFlashcardsForTopic(topic.id).length;

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

      {topic.lab ? (
        <Link
          href={topic.lab.href}
          className="flex items-center gap-3.5 rounded-2xl border-2 border-primary-tint bg-primary-soft p-4 hover:border-primary"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-strong">
            <SparkIcon size={22} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-base font-bold text-primary-strong">{topic.lab.title}</span>
            <span className="text-sm text-ink">{topic.lab.description}</span>
          </span>
          <ChevronRightIcon size={20} className="text-primary" />
        </Link>
      ) : null}

      {cardCount > 0 ? (
        <Link
          href={`/cartoes/${topic.id}`}
          className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <CardsIcon size={22} />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-base font-bold">Cartões de memória</span>
            <span className="text-sm text-muted">{cardCount} cartões para fixar as ideias deste tópico</span>
          </span>
          <ChevronRightIcon size={20} className="text-muted" />
        </Link>
      ) : null}
    </AppShell>
  );
}
