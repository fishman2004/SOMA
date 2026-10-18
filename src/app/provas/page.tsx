import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BackLink, Card, PageTitle, SectionTitle } from "@/components/ui";
import { AnswerSheet } from "@/components/views/AnswerSheet";

export const metadata: Metadata = { title: "Provas oficiais do ENEM" };

const INEP_PROVAS =
  "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos";

const STEPS = [
  "Baixe a prova e o gabarito no site do INEP. Use o gabarito da mesma cor do caderno da prova.",
  "Resolva com tempo marcado: cerca de 3 minutos por questão, como no dia do exame.",
  "Marque suas respostas no cartão-resposta abaixo (ou no papel e passe para cá depois).",
  "Só então cole o gabarito e corrija. Anote o assunto de cada questão que errou.",
];

export default function OfficialExamsPage() {
  return (
    <AppShell>
      <BackLink href="/">Início</BackLink>
      <PageTitle
        title="Provas oficiais do ENEM"
        intro="Treinar com provas anteriores é uma das melhores formas de se preparar. As provas são do INEP; aqui você corrige as suas respostas."
      />

      <Card className="gap-3 p-[18px]">
        <SectionTitle>Como fazer uma prova anterior</SectionTitle>
        <ol className="flex flex-col gap-2.5">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-strong"
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <a
          href={INEP_PROVAS}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center self-start rounded-xl bg-primary px-4 text-[15px] font-bold text-on-strong hover:bg-primary-strong"
        >
          Abrir provas e gabaritos no site do INEP
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </Card>

      <AnswerSheet />
    </AppShell>
  );
}
