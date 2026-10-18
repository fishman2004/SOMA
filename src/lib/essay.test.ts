import { describe, expect, it } from "vitest";
import {
  EMPTY_ESSAYS,
  createDraft,
  deleteDraft,
  draftToText,
  getLengthStatus,
  getSelfScore,
  getTextStats,
  normalizeEssays,
  sortDrafts,
  updateDraft,
  upsertDraft,
} from "./essay";

describe("medidas do texto", () => {
  it("conta palavras, parágrafos e caracteres ignorando espaços extras", () => {
    const s = getTextStats("  Primeiro   parágrafo aqui.\n\n\nSegundo — com travessão.  \n");
    expect(s.paragraphs).toBe(2);
    expect(s.words).toBe(6); // o travessão sozinho não é palavra
    expect(s.characters).toBe("Primeiro parágrafo aqui.".length + "Segundo — com travessão.".length);
  });

  it("estima as linhas: cada parágrafo começa numa linha nova", () => {
    expect(getTextStats("").lines).toBe(0);
    expect(getTextStats("curto").lines).toBe(1);
    expect(getTextStats("a".repeat(140)).lines).toBe(2); // 140 + recuo = 144 = 2 linhas de 72
    expect(getTextStats(`${"a".repeat(10)}\n${"b".repeat(10)}`).lines).toBe(2);
  });

  it("classifica o tamanho pelas linhas", () => {
    expect(getLengthStatus(0)).toBe("vazio");
    expect(getLengthStatus(7)).toBe("insuficiente");
    expect(getLengthStatus(8)).toBe("curto");
    expect(getLengthStatus(20)).toBe("bom");
    expect(getLengthStatus(30)).toBe("bom");
    expect(getLengthStatus(31)).toBe("acima");
  });
});

describe("autoavaliação", () => {
  it("soma 40 pontos por nível só quando as 5 competências foram avaliadas", () => {
    expect(getSelfScore({ 1: 5, 2: 4, 3: 3 })).toBeUndefined();
    expect(getSelfScore({ 1: 5, 2: 4, 3: 3, 4: 2, 5: 0 })).toBe(560);
    expect(getSelfScore({ 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 })).toBe(1000);
  });
});

describe("rascunhos", () => {
  const at = "2026-10-18T10:00:00.000Z";

  it("cria, atualiza, ordena e apaga", () => {
    let s = upsertDraft(EMPTY_ESSAYS, createDraft("a", at, "Tema A"));
    s = upsertDraft(s, createDraft("b", "2026-10-18T11:00:00.000Z"));
    s = updateDraft(s, "a", { text: "Olá" }, "2026-10-18T12:00:00.000Z");
    expect(sortDrafts(s.drafts).map((d) => d.id)).toEqual(["a", "b"]);
    expect(s.drafts.find((d) => d.id === "a")?.text).toBe("Olá");
    expect(updateDraft(s, "nao-existe", { text: "x" }, at)).toBe(s);
    expect(deleteDraft(s, "a").drafts.map((d) => d.id)).toEqual(["b"]);
  });

  it("descarta dados malformados ao ler o que está salvo", () => {
    expect(normalizeEssays(null)).toEqual(EMPTY_ESSAYS);
    expect(normalizeEssays({ drafts: "x" })).toEqual(EMPTY_ESSAYS);
    const s = normalizeEssays({
      drafts: [
        { id: "a", text: "Oi", updatedAt: at, levels: { 1: 3, 2: 9, 3: 2.5, 4: -1 }, checked: ["x", 2], seconds: -5 },
        { id: 5, text: "sem id válido" },
      ],
    });
    expect(s.drafts).toHaveLength(1);
    expect(s.drafts[0]).toMatchObject({ id: "a", theme: "", levels: { 1: 3 }, checked: ["x"], seconds: 0, createdAt: at });
  });

  it("gera o texto para baixar com o tema no topo", () => {
    expect(draftToText({ ...createDraft("a", at, " Tema "), text: "Texto.\n\n" })).toBe("Tema: Tema\n\nTexto.\n");
    expect(draftToText({ ...createDraft("a", at), text: "Texto." })).toBe("Texto.\n");
  });
});
