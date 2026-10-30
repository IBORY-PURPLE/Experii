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

describe('Markdown GFM tables and code', () => {
  const table = [
    '| emp_id | name | dept_name |',
    '| ---: | --- | --- |',
    '| 1 | 김하나 | 영업 |',
    '| 2 | **“이두리”**는 | NULL |',
    '| 3 | NULL값 | `NULL` |',
  ].join('\n');

  it('draws a table inside a scrollable region', () => {
    const out = html(`결과예요.\n\n${table}`);
    expect(out).toMatch(
      /<div class="md-table" role="region" aria-label="표" tabindex="0"><table><thead><tr><th style="text-align:right">emp_id<\/th><th>name<\/th>/,
    );
    expect(out).toContain('<td style="text-align:right">1</td>');
    expect(out).toContain('<td>김하나</td>');
    expect(out).not.toContain('|');
  });

  it('marks only a cell whose value is exactly NULL', () => {
    const out = html(table);
    expect(out.match(/class="null"/g)).toHaveLength(1);
    expect(out).toContain('<td class="null">NULL</td>');
    expect(out).toContain('<td>NULL값</td>');
    expect(out).toContain('<td><code>NULL</code></td>');
  });

  it('lets only cells with spaces wrap', () => {
    const out = html(
      [
        '| 구분 | 설명 | 입사일 |',
        '| --- | --- | --- |',
        '| LEFT | 왼쪽 행을 **모두** 남겨요 | 2024-01-08 |',
      ].join('\n'),
    );
    expect(out).toContain(
      '<td>LEFT</td><td class="wrap">왼쪽 행을 <strong>모두</strong> 남겨요</td><td>2024-01-08</td>',
    );
  });

  it('keeps Korean bold working inside a cell', () => {
    const out = html(table);
    expect(out).toContain('<td><strong>“이두리”</strong>는</td>');
    expect(out).not.toMatch(/\*/);
    expect(out).not.toContain('​');
  });

  it('keeps raw HTML as text, in a paragraph and in a cell', () => {
    const out = html(
      [
        '<b>굵게</b> <script>alert(1)</script>',
        '',
        '| 태그 |',
        '| --- |',
        '| <img src=x onerror=alert(1)> |',
      ].join('\n'),
    );
    expect(out).toContain('&lt;b&gt;굵게&lt;/b&gt;');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out).toContain(
      '<td class="wrap">&lt;img src=x onerror=alert(1)&gt;</td>',
    );
    expect(out).not.toMatch(/<(b|script|img)[\s>]/);
  });

  it('turns bare URLs into text, not links', () => {
    const out = html('문서는 https://example.com/join 에 있어요.');
    expect(out).toContain(
      '<span class="link-text">https://example.com/join</span>',
    );
    expect(out).not.toContain('<a');
  });

  it('strikes through only with two tildes', () => {
    expect(html('보통 3~5초, 길면 10~20초 걸려요.')).not.toContain('<del>');
    expect(html('~~틀린 답~~ 맞는 답')).toContain('<del>틀린 답</del>');
  });

  it('labels a code block with its language', () => {
    const out = html('```sql\nSELECT * FROM emp;\n```');
    expect(out).toContain(
      '<div class="md-code"><div class="md-code-lang">sql</div><pre><code class="language-sql">SELECT * FROM emp;\n</code></pre></div>',
    );
    expect(html('```\nplain\n```')).toContain(
      '<div class="md-code"><pre><code>plain\n</code></pre></div>',
    );
  });
});
