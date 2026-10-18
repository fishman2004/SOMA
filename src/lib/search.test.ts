import { describe, expect, it } from "vitest";
import { makeSnippet, normalize, search, type SearchEntry } from "./search";

const entries: SearchEntry[] = [
  { id: "t1", kind: "topico", title: "Porcentagem", text: "Aumentos e descontos em sequência", href: "/estudar/porcentagem" },
  { id: "q1", kind: "questao", title: "Questão de porcentagem", text: "Uma camiseta custava R$ 80,00 e teve aumento de 25%.", href: "/revisar/q1", context: "Porcentagem" },
  { id: "k1", kind: "tecnica", title: "Método das linhas", text: "O chamado método chinês de multiplicação", href: "/tecnicas/linhas" },
  { id: "c1", kind: "cartao", title: "Qual a fórmula da média?", text: "Soma dos valores dividida pela quantidade", href: "/cartoes/graficos" },
];

describe("busca", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalize("  Função   do 1º GRAU ")).toBe("funcao do 1º grau");
    expect(search(entries, "metodo CHINES").map((r) => r.id)).toEqual(["k1"]);
    expect(search(entries, "fórmula média").map((r) => r.id)).toEqual(["c1"]);
  });

  it("exige todas as palavras", () => {
    expect(search(entries, "porcentagem camiseta").map((r) => r.id)).toEqual(["q1"]);
    expect(search(entries, "porcentagem girafa")).toEqual([]);
  });

  it("dá mais peso ao título e ao tópico", () => {
    expect(search(entries, "porcentagem").map((r) => r.id)).toEqual(["t1", "q1"]);
  });

  it("não busca com menos de 2 letras", () => {
    expect(search(entries, "p")).toEqual([]);
    expect(search(entries, "   ")).toEqual([]);
  });

  it("mostra um trecho em volta da palavra encontrada", () => {
    const [r] = search(entries, "camiseta");
    expect(r.snippet).toContain("camiseta custava");
    expect(search(entries, "linhas")[0].snippet).toBe("");
  });

  it("o trecho respeita acentos do texto original", () => {
    const text = "x".repeat(100) + " função afim " + "y".repeat(100);
    const s = makeSnippet(text, "funcao", 10);
    expect(s).toContain("função");
    expect(s.startsWith("…")).toBe(true);
    expect(s.endsWith("…")).toBe(true);
  });
});
