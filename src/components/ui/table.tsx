"use client";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sort?: (row: T) => number | string;
  align?: "left" | "right";
  className?: string;
}

export function DataTable<T extends { id: string }>({ columns, rows, onRowClick, empty }: { columns: Column<T>[]; rows: T[]; onRowClick?: (r: T) => void; empty?: React.ReactNode }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    return [...rows].sort((a, b) => (col.sort!(a) > col.sort!(b) ? sort.dir : -sort.dir));
  }, [rows, sort, columns]);

  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-3 font-semibold", c.align === "right" && "text-right")}>
                {c.sort ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-fg"
                    onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: -1 }))}
                  >
                    {c.header}
                    {sort?.key === c.key ? sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-50" />}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("border-b border-border last:border-0", onRowClick && "cursor-pointer hover:bg-surface-2/60")}>
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3", c.align === "right" && "tabular text-right", c.className)}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
