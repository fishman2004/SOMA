import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, PageTitle, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Sobre o SOMA" };

const INEP_PROVAS =
  "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos";
const GITHUB = "https://github.com/fishman2004/SOMA";

const STEPS = [
  { title: "Aprender", text: "Cada tópico tem a ideia-chave, as fórmulas, o erro mais comum e um exemplo resolvido." },
  { title: "Praticar", text: "Questões com feedback na hora: o raciocínio completo e a armadilha que pega muita gente." },
  { title: "Revisar", text: "Erros vão para o caderno; cartões de memória voltam no dia certo para não serem esquecidos." },
  { title: "Evoluir", text: "Domínio por tópico, simulados e conquistas mostram o que você já sabe e o próximo passo." },
];

export default function AboutPage() {
  return (
    <AppShell nav="inicio">
      <PageTitle
        eyebrow="Sistema de Organização, Memorização e Aprendizagem"
        title="Sobre o SOMA"
        intro="Uma plataforma gratuita de estudos, começando pelo ENEM. A missão é tornar o conhecimento mais acessível, o aprendizado mais inteligente e cada conquista possível."
      />

      <Card className="p-[18px]">
        <SectionTitle>Como o SOMA ensina</SectionTitle>
        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-strong"
              >
                {i + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold">{s.title}</span>
                <span className="text-[15px] leading-relaxed text-muted">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>Seus dados</SectionTitle>
        <p className="text-[15px] leading-relaxed">
          O SOMA não pede cadastro e não coleta dados pessoais. Seu progresso fica salvo só no seu navegador. Para levar o
          progresso para outro aparelho, use “Baixar cópia” na tela de{" "}
          <Link href="/progresso" className="font-bold text-primary underline underline-offset-2">
            Progresso
          </Link>
          .
        </p>
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>De onde vem o conteúdo</SectionTitle>
        <p className="text-[15px] leading-relaxed">
          Todas as questões, cartões e explicações são autorais do SOMA, no estilo do ENEM. Nada é apresentado como questão
          oficial. Cada item mostra se já passou por revisão humana; enquanto isso, aparece como “aguardando revisão”.
        </p>
        <p className="text-[15px] leading-relaxed">
          As provas e gabaritos oficiais do ENEM são publicados pelo INEP:{" "}
          <a
            href={INEP_PROVAS}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-primary underline underline-offset-2"
          >
            provas e gabaritos no site do INEP
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          .
        </p>
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>Quer ajudar?</SectionTitle>
        <p className="text-[15px] leading-relaxed">
          Professores e estudantes podem conferir as questões e explicações e apontar o que precisa melhorar.
        </p>
        <Link
          href="/revisao-conteudo"
          className="inline-flex min-h-11 items-center self-start rounded-xl bg-primary px-4 text-[15px] font-bold text-on-strong hover:bg-primary-strong"
        >
          Revisar conteúdo
        </Link>
        <p className="text-sm text-muted">
          O código do SOMA está no{" "}
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline underline-offset-2">
            GitHub
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          .
        </p>
      </Card>
    </AppShell>
  );
}
