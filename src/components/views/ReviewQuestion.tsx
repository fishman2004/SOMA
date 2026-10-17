"use client";

import Link from "next/link";
import type { Question } from "@/content";
import { QuestionPlayer } from "../QuestionPlayer";
import { ArrowRightIcon } from "../icons";
import { buttonPrimary } from "../ui";

/** Refazer uma questão do caderno de erros. */
export function ReviewQuestion({ question }: { question: Question }) {
  return (
    <QuestionPlayer
      question={question}
      mode="revisao"
      renderNext={({ correct }) => (
        <>
          <p className="text-[15px] text-muted" role="status">
            {correct
              ? "Resolvido! A questão foi para a aba Resolvidos do caderno."
              : "Ela continua no caderno. Tente de novo outro dia."}
          </p>
          <Link href="/erros" className={buttonPrimary}>
            Voltar ao caderno de erros
            <ArrowRightIcon size={18} />
          </Link>
        </>
      )}
    />
  );
}
