import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ModelList } from '../../src/shared/ipc';
import { ModelSelect, modelChoice } from '../../src/renderer/ModelSelect';

const list: ModelList = {
  models: [
    { slug: 'gpt-a', displayName: 'A' },
    { slug: 'gpt-b', displayName: 'B' },
  ],
  current: 'gpt-a',
};

const html = (props: Partial<Parameters<typeof ModelSelect>[0]>) =>
  renderToStaticMarkup(
    createElement(ModelSelect, {
      list,
      model: null,
      busy: false,
      onPick: () => {},
      ...props,
    }),
  );

describe('modelChoice', () => {
  it('offers the account list and shows the conversation model', () => {
    expect(modelChoice(list, 'gpt-b')).toEqual({
      options: list.models,
      value: 'gpt-b',
      locked: false,
    });
  });

  it('falls back to the new-conversation default when the conversation has none', () => {
    expect(modelChoice(list, null).value).toBe('gpt-a');
  });

  it('keeps a conversation model the list no longer has', () => {
    expect(modelChoice(list, 'gpt-old').options).toEqual([
      ...list.models,
      { slug: 'gpt-old', displayName: 'gpt-old' },
    ]);
  });

  it('shows only the conversation model and locks without a list', () => {
    expect(modelChoice(null, 'gpt-b')).toEqual({
      options: [{ slug: 'gpt-b', displayName: 'gpt-b' }],
      value: 'gpt-b',
      locked: true,
    });
  });

  it('locks a list of one, and names the default when nothing is known', () => {
    expect(
      modelChoice({ models: [list.models[0]], current: 'gpt-a' }, null).locked,
    ).toBe(true);
    expect(modelChoice({ models: [], current: null }, null)).toEqual({
      options: [{ slug: '', displayName: '기본 모델' }],
      value: '',
      locked: true,
    });
  });
});

describe('ModelSelect', () => {
  it('is a labelled select with the display names', () => {
    const out = html({ model: 'gpt-b' });
    expect(out).toContain('aria-label="모델"');
    expect(out).toContain('title="모델: B (gpt-b)"');
    expect(out).toMatch(/<option value="gpt-a">A<\/option>/);
    expect(out).toMatch(/<option value="gpt-b" selected="">B<\/option>/);
    expect(out).not.toContain('disabled');
  });

  it('locks while an answer streams and when the list did not come', () => {
    expect(html({ busy: true })).toContain('disabled=""');
    expect(html({ list: null, model: 'gpt-b' })).toContain('disabled=""');
  });
});
