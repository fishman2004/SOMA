/**
 * Desenho da multiplicação por linhas (o "método chinês").
 *
 * O primeiro número vira linhas horizontais (dezenas em cima, unidades
 * embaixo) e o segundo, linhas verticais (dezenas à esquerda, unidades à
 * direita). Girando o desenho 45°, os cruzamentos formam três colunas:
 * centenas à esquerda, dezenas no meio e unidades à direita.
 */

const SIZE = 300;
const CENTER = SIZE / 2;
const GAP = 13;
const TENS_POS = 105;
const UNITS_POS = 195;
const LINE_START = 40;
const LINE_END = 260;

function spread(count: number, center: number): number[] {
  return Array.from({ length: count }, (_, i) => center + (i - (count - 1) / 2) * GAP);
}

type Group = "centenas" | "dezenas" | "unidades";

const GROUP_CLASS: Record<Group, string> = {
  centenas: "fill-primary",
  dezenas: "fill-success",
  unidades: "fill-error",
};

export function LinesDiagram({ a, b }: { a: number; b: number }) {
  const [at, au] = String(a).split("").map(Number);
  const [bt, bu] = String(b).split("").map(Number);

  const rowsTens = spread(at, TENS_POS);
  const rowsUnits = spread(au, UNITS_POS);
  const colsTens = spread(bt, TENS_POS);
  const colsUnits = spread(bu, UNITS_POS);

  const dots: { x: number; y: number; group: Group }[] = [];
  const add = (rows: number[], cols: number[], group: Group) => {
    for (const y of rows) for (const x of cols) dots.push({ x, y, group });
  };
  add(rowsTens, colsTens, "centenas");
  add(rowsTens, colsUnits, "dezenas");
  add(rowsUnits, colsTens, "dezenas");
  add(rowsUnits, colsUnits, "unidades");

  const count = (g: Group) => dots.filter((d) => d.group === g).length;
  const labels: { group: Group; x: number }[] = [
    { group: "centenas", x: 86 },
    { group: "dezenas", x: CENTER },
    { group: "unidades", x: 214 },
  ];

  const titleId = `linhas-${a}-${b}-titulo`;
  const descId = `linhas-${a}-${b}-desc`;

  return (
    <figure className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3">
      <svg
        viewBox={`0 0 ${SIZE} 336`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="w-full max-w-[320px]"
      >
        <title id={titleId}>{`Multiplicação por linhas de ${a} × ${b}`}</title>
        <desc id={descId}>
          {`${count("centenas")} cruzamentos no grupo das centenas, ${count("dezenas")} no das dezenas e ${count("unidades")} no das unidades.`}
        </desc>

        <g transform={`rotate(-45 ${CENTER} ${CENTER})`}>
          {[...rowsTens, ...rowsUnits].map((y, i) => (
            <line
              key={`h${i}`}
              x1={LINE_START}
              x2={LINE_END}
              y1={y}
              y2={y}
              className="stroke-ink"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
          {[...colsTens, ...colsUnits].map((x, i) => (
            <line
              key={`v${i}`}
              x1={x}
              x2={x}
              y1={LINE_START}
              y2={LINE_END}
              className="stroke-muted"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ))}
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={4.5} className={GROUP_CLASS[d.group]} />
          ))}
        </g>

        {labels.map(({ group, x }) => (
          <g key={group}>
            <text x={x} y={304} textAnchor="middle" className="fill-ink font-display text-[20px] font-bold">
              {count(group)}
            </text>
            <text x={x} y={326} textAnchor="middle" className="fill-muted text-[12px]">
              {group}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-center text-sm text-muted">
        Linhas escuras: {a}. Linhas cinza: {b}. Cada ponto colorido é um cruzamento.
      </figcaption>
    </figure>
  );
}
