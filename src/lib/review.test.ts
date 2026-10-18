import { describe, expect, it } from "vitest";
import { getAllFlashcards, getAllQuestions, getTechniqueTexts, getTopics } from "@/content";
import {
  buildReviewItems,
  exportReview,
  parseReviewState,
  setComment,
  setVerdict,
  summarize,
  type ReviewState,
} from "./review";

const items = buildReviewItems(
  getTopics(),
  getAllQuestions(),
  getAllFlashcards(),
  getTechniqueTexts(),
  "tecnicas-de-calculo",
);

describe("revisão de conteúdo", () => {
  it("lista todo o conteúdo, sem repetir", () => {
    const expected =
      getTopics().filter((t) => t.content).length +
      getAllQuestions().length +
      getAllFlashcards().length +
      getTechniqueTexts().length;
    expect(items).toHaveLength(expected);
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
  });

  it("conta aprovados, ajustes e pendentes", () => {
    let s: ReviewState = {};
    s = setVerdict(s, "questao:porc-001", "ok", "t1");
    s = setComment(s, "questao:porc-002", "Trocar a palavra olimpíada", "t2");
    expect(s["questao:porc-002"].verdict).toBe("ajustar");
    expect(summarize(s, items)).toEqual({ total: items.length, ok: 1, adjust: 1, pending: items.length - 2 });
  });

  it("manter o comentário ao mudar o veredito e apagar ao desfazer", () => {
    let s = setComment({}, "cartao:pc-01", "ok assim", "t1");
    s = setVerdict(s, "cartao:pc-01", "ok", "t2");
    expect(s["cartao:pc-01"]).toEqual({ verdict: "ok", comment: "ok assim", at: "t2" });
    s = setVerdict(s, "cartao:pc-01", null, "t3");
    expect(s["cartao:pc-01"]).toBeUndefined();
  });

  it("exporta só os itens revisados", () => {
    const s = setVerdict({}, "tecnica:linhas", "ok", "t1");
    const data = JSON.parse(exportReview(s, items, new Date("2026-10-18T12:00:00Z")));
    expect(data.kind).toBe("revisao-de-conteudo");
    expect(data.itens).toEqual([
      { tipo: "tecnica", id: "linhas", topico: "tecnicas-de-calculo", veredito: "ok", comentario: "" },
    ]);
  });

  it("ignora dados salvos inválidos", () => {
    expect(parseReviewState(null)).toEqual({});
    expect(parseReviewState({ a: { verdict: "talvez", at: "x" }, b: { verdict: "ok", at: "y" } })).toEqual({
      b: { verdict: "ok", comment: "", at: "y" },
    });
  });
});
