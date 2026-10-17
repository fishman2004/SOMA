/**
 * Leitura e conferência de respostas numéricas digitadas pelo estudante.
 *
 * Aceita o jeito brasileiro de escrever números ("1.250,5", "12,5", "R$ 80,00")
 * e também o ponto como decimal ("12.5"), comum em calculadoras.
 */

/** Converte o texto digitado em número, ou `null` se não houver número válido. */
export function parseNumber(input: string): number | null {
  let s = input
    .trim()
    .replace(/[−–]/g, "-") // sinais de menos tipográficos
    .replace(/[^0-9,.\-]/g, ""); // tira R$, %, espaços, unidades

  if (!/\d/.test(s)) return null;

  const negative = s.startsWith("-");
  s = s.replace(/-/g, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    // Os dois aparecem: o último é o separador decimal.
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    s = s.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    // Só vírgula: decimal no padrão brasileiro. Mais de uma vírgula não é válido.
    if (s.indexOf(",") !== lastComma) return null;
    s = s.replace(",", ".");
  } else if (lastDot >= 0) {
    // Só ponto: "1.250" ou "1.250.000" é milhar; "12.5" é decimal.
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.split(".").join("");
    else if (s.indexOf(".") !== lastDot) return null;
  }

  if (!/^\d*\.?\d+$|^\d+\.?$/.test(s)) return null;
  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** Confere se o valor está dentro da tolerância da resposta esperada. */
export function isNumericAnswerCorrect(value: number, answer: number, tolerance = 0): boolean {
  return Math.abs(value - answer) <= tolerance + 1e-9;
}

/** Escreve um número no padrão brasileiro, com até 2 casas decimais. */
export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** Número com prefixo e unidade, ex.: "R$ 1.020" ou "5 m". */
export function formatWithUnit(value: number, prefix?: string, unit?: string): string {
  const prefixPart = prefix ? `${prefix} ` : "";
  const unitPart = unit ? ` ${unit}` : "";
  const number =
    prefix === "R$"
      ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : formatNumber(value);
  return `${prefixPart}${number}${unitPart}`;
}
