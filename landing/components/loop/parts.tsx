import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { MockTable, SqlLine } from '@/content/loop';

// Column names may break after "_" so a 3-column result still fits a phone narrower than 360px.
const breakable = (name: string) =>
  name.split('_').map((part, i, all) =>
    i < all.length - 1 ? (
      <Fragment key={i}>
        {part}_<wbr />
      </Fragment>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

export function MockTableView({ table, className }: { table: MockTable; className?: string }) {
  return (
    <table className={className ? `mt ${className}` : 'mt'}>
      {table.caption ? <caption>{table.caption}</caption> : null}
      <thead>
        <tr>
          {table.columns.map((c) => (
            <th key={c} scope="col">
              {breakable(c)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((r, i) => (
          <tr key={i} className={table.highlightRow === i ? 'hl' : undefined}>
            {r.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SqlBlock({
  lines,
  className,
  blank,
  srcLine,
}: {
  lines: readonly SqlLine[];
  className?: string;
  blank?: ReactNode;
  srcLine?: number;
}) {
  return (
    <pre className={className ? `sql ${className}` : 'sql'}>
      <code>
        {lines.map((line, i) => (
          <span
            key={i}
            className={srcLine === i ? 'ln src-line' : 'ln'}
            style={line.indent ? ({ '--ind': `${line.indent}ch` } as CSSProperties) : undefined}
          >
            {line.parts.map((p, j) => (
              <Fragment key={j}>{typeof p === 'string' ? p : 'kw' in p ? <b>{p.kw}</b> : blank}</Fragment>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
}
