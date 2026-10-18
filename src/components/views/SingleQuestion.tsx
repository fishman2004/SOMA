"use client";

import Link from "next/link";
import type { Question } from "@/content";
import { QuestionPlayer } from "../QuestionPlayer";
import { ArrowRightIcon } from "../icons";
import { buttonPrimary } from "../ui";

/** Uma questão avulsa (aberta pela busca), respondida como prática. */
export function SingleQuestion({ question, topicName }: { question: Question; topicName: string }) {
  return (
    <QuestionPlayer
      question={question}
      mode="pratica"
      renderNext={({ correct }) => (
        <>
          {!correct ? (
            <p className="text-[15px] text-muted" role="status">
              A questão foi para o caderno de erros. Refaça outro dia para fixar.
            </p>
          ) : null}
          <Link href={`/praticar/${question.topicId}`} className={buttonPrimary}>
            Praticar {topicName}
            <ArrowRightIcon size={18} />
          </Link>
          <Link href="/buscar" className="inline-flex min-h-11 items-center justify-center font-bold text-primary">
            Voltar para a busca
          </Link>
        </>
      )}
    />
  );
}
