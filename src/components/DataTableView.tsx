import type { DataTable } from "@/content";

/** Tabela de dados do enunciado. Rola na horizontal se não couber na tela. */
export function DataTableView({ table }: { table: DataTable }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full border-collapse text-left text-base">
        <caption className="border-b border-line px-3.5 py-2.5 text-left text-sm font-bold text-muted">
          {table.caption}
        </caption>
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th key={h} scope="col" className="border-b border-line bg-ground px-3.5 py-2 text-sm font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-b-0">
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" className="px-3.5 py-2 font-bold">
                    {cell}
                  </th>
                ) : (
                  <td key={j} className="px-3.5 py-2 font-display tabular-nums">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
