import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from '../../src/renderer/Markdown';

const html = (text: string) =>
  renderToStaticMarkup(createElement(Markdown, { text }));

describe('Markdown emphasis next to Korean', () => {
  const emphasized: Array<[string, string]> = [
    ['이건 **“다시 보기”**고 저건 아니에요.', '<strong>“다시 보기”</strong>고'],
    ['**인덱스(Index)**는 빨라요.', '<strong>인덱스(Index)</strong>는'],
    ['이것은**“중요”**입니다.', '이것은<strong>“중요”</strong>입니다'],
    [
      '**강조(1)**와 **강조(2)**를 비교',
      '<strong>강조(1)</strong>와 <strong>강조(2)</strong>를',
    ],
    ['*“기울임”*은', '<em>“기울임”</em>은'],
    ['좋아요. **조인**부터 볼게요.', '<strong>조인</strong>부터'],
  ];
  for (const [text, expected] of emphasized) {
    it(`renders ${text}`, () => {
      const out = html(text);
      expect(out).toContain(expected);
      expect(out).not.toMatch(/\*/);
    });
  }

  const untouched: Array<[string, string]> = [
    ['`**“코드”**고` 안은 그대로', '<code>**“코드”**고</code>'],
    ['```\nx = [**결과**]\n```', '<code>x = [**결과**]\n</code>'],
    [String.raw`\*\*“이스케이프”\*\*는 그대로`, '**“이스케이프”**는'],
    ['(a+b)**2 + (c+d)**2', '(a+b)**2 + (c+d)**2'],
  ];
  for (const [text, expected] of untouched) {
    it(`keeps ${text.split('\n').join(' ')} as CommonMark renders it`, () => {
      expect(html(text)).toContain(expected);
    });
  }

  it('leaves no zero-width space in the output', () => {
    for (const [text] of [...emphasized, ...untouched])
      expect(html(text)).not.toContain('​');
  });
});
