import { expect, test, type Page } from "@playwright/test";

/**
 * Fluxos principais do SOMA, do jeito que um estudante usa.
 * Cada teste começa com o navegador limpo (sem progresso salvo).
 */

/** Responde a questão aberta: escolhe uma alternativa ou digita um número. */
async function answerAny(page: Page, choice = 0) {
  const radios = page.locator("label:has(input[type=radio])");
  if (await radios.count()) {
    await radios.nth(choice).click();
  } else {
    await page.locator("input[inputmode=decimal]").fill("1");
  }
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
}

test("estudar um tópico, praticar e ver o resumo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "O que vamos aprender hoje?" })).toBeVisible();
  await page.getByRole("link", { name: "Começar" }).click();
  await expect(page.getByRole("heading", { name: "Porcentagem", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: /Praticar/ }).click();
  await expect(page.getByText(/^Questão 1 de \d+$/)).toBeVisible();

  // Primeira questão: erra de propósito (R$ 84,00) e registra a causa.
  await page.locator("label", { hasText: "R$ 84,00" }).click();
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.getByRole("heading", { name: /Ainda não/ })).toBeVisible();
  await page.getByRole("button", { name: "Errei o cálculo" }).click();

  // Responde o resto até o resumo.
  while (!(await page.getByRole("button", { name: "Ver resumo" }).isVisible())) {
    await page.getByRole("button", { name: "Próxima questão" }).click();
    await answerAny(page);
  }
  await page.getByRole("button", { name: "Ver resumo" }).click();
  await expect(page.getByRole("heading", { name: /Você acertou/ })).toBeVisible();

  // O erro está no caderno, com a causa.
  await page.getByRole("link", { name: "Ir para o caderno de erros" }).click();
  await expect(page.getByText("Causa:").first()).toBeVisible();
  await expect(page.getByText("Errei o cálculo")).toBeVisible();
});

test("refazer um erro e vê-lo resolvido", async ({ page }) => {
  await page.goto("/revisar/porc-005");
  await page.getByLabel("Qual foi o preço com desconto?").fill("180");
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.getByText("Você caiu num erro comum")).toBeVisible();

  await page.goto("/revisar/porc-005");
  await page.getByLabel("Qual foi o preço com desconto?").fill("1.020,00");
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.getByRole("heading", { name: "Isso! Resposta correta." })).toBeVisible();

  await page.goto("/erros");
  await page.getByRole("tab", { name: /Resolvidos/ }).click();
  await expect(page.getByText("Resolvido", { exact: true })).toBeVisible();
});

test("revisar cartões de memória", async ({ page }) => {
  // Abrir o tópico libera os cartões dele.
  await page.goto("/estudar/porcentagem");
  await page.waitForFunction(() => localStorage.getItem("soma:progress:v1")?.includes("porcentagem"));
  await page.goto("/cartoes");
  await expect(page.getByText("5 cartões na fila")).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Mostrar resposta" }).click();
    await page.getByRole("button", { name: /^Fácil/ }).click();
  }
  await expect(page.getByRole("heading", { name: "Revisão concluída!" })).toBeVisible();
});

test("fazer um simulado e ver a correção", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("/simulado");
  await page.getByText("5", { exact: true }).click();
  await page.getByRole("button", { name: "Começar simulado" }).click();
  await expect(page.getByRole("heading", { name: /Questão 1/ })).toBeVisible();
  await page.getByRole("button", { name: "Entregar" }).first().click();
  await expect(page.getByRole("heading", { name: /de 5 acertos/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Correção" })).toBeVisible();
});

test("técnica de cálculo: passo a passo e treino", async ({ page }) => {
  await page.goto("/tecnicas/vezes-11");
  await expect(page.getByText("63 × 11 = 693")).toBeVisible();

  await page.getByRole("button", { name: "Começar treino" }).click();
  for (let i = 0; i < 10; i++) {
    const label = await page.locator("label[for=treino-resposta]").innerText();
    const n = Number(label.match(/\d+/)![0]);
    await page.locator("#treino-resposta").fill(String(n * 11));
    await page.keyboard.press("Enter");
    if (i < 9) await expect(page.locator("label[for=treino-resposta]")).not.toHaveText(label);
  }
  await expect(page.getByText(/10 de 10 em/)).toBeVisible();
});

test("desafio do dia fica registrado", async ({ page }) => {
  await page.goto("/desafio");
  for (let i = 0; i < 3; i++) {
    await answerAny(page, i);
    await page.getByRole("button", { name: i === 2 ? "Ver resumo" : "Próxima questão" }).click();
  }
  await expect(page.getByText("Desafio de hoje concluído")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(/^Feito:/)).toBeVisible();
});

test("a segunda rodada de prática traz as questões que faltam", async ({ page }) => {
  await page.goto("/praticar/porcentagem");
  const seen: string[] = [];
  for (let i = 0; i < 5; i++) {
    seen.push(await page.locator("main p").first().innerText());
    await answerAny(page);
    await page.getByRole("button", { name: i === 4 ? "Ver resumo" : "Próxima questão" }).click();
  }
  await page.getByRole("button", { name: "Praticar outra rodada" }).click();
  await expect(page.getByText(/^Questão 1 de 5$/)).toBeVisible();

  // Na segunda rodada aparecem questões que ainda não tinham sido vistas.
  const second: string[] = [];
  for (let i = 0; i < 5; i++) {
    second.push(await page.locator("main p").first().innerText());
    await answerAny(page);
    await page.getByRole("button", { name: i === 4 ? "Ver resumo" : "Próxima questão" }).click();
  }
  expect(second.filter((s) => !seen.includes(s)).length).toBeGreaterThan(0);
});
