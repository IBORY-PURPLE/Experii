import { isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hero } from '@/content/landing';

vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(public element: ReactNode) {}
  },
}));

function texts(node: ReactNode): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (isValidElement<{ children?: ReactNode }>(node)) return texts(node.props.children);
  return [];
}

function columns(node: ReactNode): ReactNode[] {
  return isValidElement<{ children?: ReactNode }>(node) ? [node.props.children].flat() : [];
}

describe('opengraph image', () => {
  it('marks the Before→After figure as an example, like the figure on the page', async () => {
    const { default: OpengraphImage } = await import('@/app/opengraph-image');
    const { element } = (await OpengraphImage()) as unknown as { element: ReactNode };
    const figure = columns(element).find((col) => texts(col).includes(hero.after));
    expect(figure).toBeDefined();
    expect(texts(figure)).toContain(hero.badge);
  });
});
