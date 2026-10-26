import { Fragment } from 'react';

export type Rich = string | { b: string };

export function RichText({ parts }: { parts: readonly Rich[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{typeof p === 'string' ? p : <b>{p.b}</b>}</Fragment>
      ))}
    </>
  );
}

export function richToText(parts: readonly Rich[]) {
  return parts.map((p) => (typeof p === 'string' ? p : p.b)).join('');
}
