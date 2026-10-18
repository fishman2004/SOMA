import { defineConfig, devices } from "@playwright/test";

/**
 * Testes de ponta a ponta: abrem o SOMA num navegador de verdade e
 * percorrem os fluxos principais como um estudante.
 *
 * Rodar: npm run build && npm run test:e2e
 * (na primeira vez, instale o navegador: npx playwright install chromium)
 */
const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    // Permite usar um Chromium já instalado (ex.: PW_CHROMIUM_PATH=/caminho/do/chrome).
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "computador", use: { viewport: { width: 1280, height: 800 }, browserName: "chromium" } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
