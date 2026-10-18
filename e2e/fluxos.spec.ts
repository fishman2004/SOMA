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

  // O Progresso mostra a causa mais comum, com uma dica.
  await page.goto("/progresso");
  await expect(page.getByRole("heading", { name: "Por que você erra" })).toBeVisible();
  await expect(page.getByText(/^Dica:/)).toBeVisible();
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

test("corrigir uma prova oficial pelo cartão-resposta", async ({ page }) => {
  await page.goto("/provas");
  await page.getByLabel("Primeira questão").fill("136");
  await page.getByRole("button", { name: "Abrir cartão-resposta" }).click();
  await page.getByRole("button", { name: "Questão 136, alternativa A" }).click();
  await page.getByRole("button", { name: "Questão 137, alternativa C" }).click();
  await page.getByLabel("Gabarito oficial").fill("136 A 137 B 138 X");
  await expect(page.getByText("3 respostas lidas")).toBeVisible();
  await page.getByRole("button", { name: "Corrigir" }).click();
  await expect(page.getByText("1 de 2 (50%)")).toBeVisible();
  await expect(page.getByText("Suas provas corrigidas")).toBeVisible();
});

test("errar uma questão e treinar com questões gêmeas", async ({ page }) => {
  await page.goto("/praticar/porcentagem");
  await page.locator("label", { hasText: "R$ 84,00" }).click();
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await page.getByRole("link", { name: /Treinar com questões gêmeas/ }).click();

  await expect(page.locator("h1:visible")).toHaveText("Aumento seguido de desconto");
  await expect(page.getByText("Nenhuma respondida ainda")).toBeVisible();
  const first = await page.locator("main:visible").innerText();

  await answerAny(page);
  await expect(page.getByText(/de 1 certas$/)).toBeVisible();
  await expect(page.locator("main:visible").getByText("Salva no seu caderno de erros")).toHaveCount(0);

  await page.getByRole("button", { name: "Outra questão gêmea" }).click();
  await expect(page.getByRole("button", { name: "Confirmar resposta" })).toBeVisible();
  expect(await page.locator("main:visible").innerText()).not.toBe(first);

  // As gêmeas não entram no caderno: só a questão fixa errada aparece.
  await page.goto("/erros");
  await expect(page.locator("main:visible").getByRole("link", { name: "Refazer", exact: true })).toHaveCount(1);
});

test("mapa de habilidades mostra o que precisa de atenção", async ({ page }) => {
  await page.goto("/praticar/porcentagem");
  await page.locator("label", { hasText: "R$ 84,00" }).click();
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.getByRole("heading", { name: /Ainda não/ })).toBeVisible();

  await page.goto("/mapa");
  const main = page.locator("main:visible");
  await expect(main.getByRole("heading", { name: "0 de 20 habilidades firmes" })).toBeVisible();
  await expect(main.locator("p", { hasText: "Sugestão agora:" })).toContainText("Aumento seguido de desconto");
  await main.getByRole("link", { name: "Reforçar esta habilidade" }).click();
  await expect(page.locator("h1:visible")).toHaveText("Aumento seguido de desconto");
});

test("buscar e abrir uma questão avulsa", async ({ page }) => {
  await page.goto("/");
  await page.locator("main:visible").getByRole("link", { name: "Buscar" }).or(page.getByRole("complementary").getByRole("link", { name: "Buscar" })).first().click();
  const box = page.getByRole("searchbox", { name: "Buscar no SOMA" });
  await box.fill("metodo chines");
  await expect(page.getByRole("list", { name: "Resultados da busca" }).getByRole("link").first()).toContainText("Técnica");

  await box.fill("celular desconto");
  await page.getByRole("list", { name: "Resultados da busca" }).getByRole("link", { name: /Questão/ }).first().click();
  await expect(page.locator("h1:visible")).toHaveText("Questão avulsa");
  await answerAny(page);
  await expect(page.getByRole("link", { name: "Praticar Porcentagem" })).toBeVisible();

  await page.goto("/buscar?q=girafa");
  await expect(page.getByText("Nada encontrado para “girafa”.")).toBeVisible();
});

test("laboratório de redação: escrever, medir e se autoavaliar", async ({ page }) => {
  await page.goto("/redacao");
  await page.getByRole("button", { name: /desperdício de alimentos/ }).click();
  const main = page.locator("main:visible");
  await expect(main.getByLabel("Tema", { exact: true })).toHaveValue(/desperdício de alimentos/);

  await main.getByLabel("Seu texto").fill("Um texto curto demais.");
  await expect(page.getByText(/Até 7 linhas/)).toBeVisible();

  for (let c = 1; c <= 5; c++) {
    await main.getByRole("radiogroup").nth(c - 1).getByText("Bom", { exact: true }).click();
  }
  await expect(page.getByText("Sua autoavaliação: 800 de 1000")).toBeVisible();

  await page.goto("/redacao");
  await expect(page.locator("main:visible").getByRole("link", { name: /desperdício de alimentos/ })).toContainText("autoavaliação 800");
});
