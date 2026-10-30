import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Roadmap } from '../../src/renderer/Roadmap';
import { Sidebar } from '../../src/renderer/Sidebar';
import type {
  CardField,
  DoneNode,
  RoadmapNode,
  Subject,
} from '../../src/shared/ipc';

type Fields = Partial<Record<CardField, string>>;

const subject: Subject = {
  id: 's1',
  title: 'SQLD',
  cardCount: 1,
  createdAt: 0,
};
const done: DoneNode = {
  kind: 'done',
  conversationId: 'c-done',
  cardId: 'card-1',
  title: '예전 제목',
  summary: '예전 요약',
  interviewLine: '예전 한 마디',
  useful: null,
  turns: 1,
  notes: 0,
  createdAt: 0,
};
const nodes: RoadmapNode[] = [
  done,
  {
    kind: 'current',
    conversationId: 'c-now',
    title: 'LEFT JOIN이 헷갈려요',
    turns: 2,
    notes: 0,
    createdAt: 1,
  },
];

const roadmap = (making: string | null, fields: Fields | null) =>
  renderToStaticMarkup(
    createElement(Roadmap, {
      roadmap: {
        subject,
        stats: { cards: 1, useful: 0, rated: 0, unrated: 1 },
        nodes,
      },
      activeConversationId: null,
      makingConversationId: making,
      makingFields: fields,
      openCardId: null,
      openLockedId: null,
      cardView: null,
      lockedBubble: null,
      onOpenConversation: () => {},
      onOpenCard: () => {},
      onOpenLocked: () => {},
    }),
  );

const sidebar = (making: Parameters<typeof Sidebar>[0]['making']) =>
  renderToStaticMarkup(
    createElement(Sidebar, {
      subjects: [subject],
      subjectId: subject.id,
      experiences: [done],
      making,
      openCardId: null,
      account: 'ChatGPT Plus',
      onSelect: () => {},
      onNewSubject: () => {},
      onOpenCard: () => {},
      onSignOut: () => {},
      onFold: () => {},
    }),
  );

describe('the tile of a card being made', () => {
  it('shows the conversation until a field arrives', () => {
    const out = roadmap('c-now', {});
    expect(out).toContain('<h3>LEFT JOIN이 헷갈려요</h3>');
    expect(out).toContain(
      '2턴 대화 중 · 마치면 “경험으로 남기기”를 눌러 주세요',
    );
    expect(out).toContain('카드 만드는 중');
  });

  it('fills in the title, then the summary and the interview line', () => {
    const titled = roadmap('c-now', { title: '조인 결과를 직접 비교했다' });
    expect(titled).toContain('<h3>조인 결과를 직접 비교했다</h3>');
    expect(titled).toContain('2턴 대화 중');

    const full = roadmap('c-now', {
      title: '조인 결과를 직접 비교했다',
      summary: '두 조인의 행 수를 비교했다.',
      interview_line: '작은 표로 재현했습니다.',
    });
    expect(full).toContain('<p>두 조인의 행 수를 비교했다.</p>');
    expect(full).not.toContain('2턴 대화 중');
    expect(full).toMatch(/면접 한 마디<\/small>작은 표로 재현했습니다\./);
  });

  it('rewrites a done tile in place while its card is made again', () => {
    const out = roadmap('c-done', { title: '새 제목' });
    expect(out).toContain('<h3>새 제목</h3>');
    expect(out).toContain('<p>예전 요약</p>');
    expect(out).toContain('다시 만드는 중');
  });

  it('leaves other tiles alone', () => {
    const out = roadmap(null, { title: '새 제목' });
    expect(out).not.toContain('새 제목');
    expect(out).toContain('<h3>예전 제목</h3>');
  });
});

describe('the sidebar item of a card being made', () => {
  it('shows the streamed title and summary above the making note', () => {
    const out = sidebar({
      conversationId: 'c-now',
      title: 'LEFT JOIN이 헷갈려요',
      fields: {
        title: '조인 결과를 직접 비교했다',
        summary: '두 조인의 행 수를 비교했다.',
      },
    });
    expect(out).toMatch(
      /role="status".*조인 결과를 직접 비교했다.*두 조인의 행 수를 비교했다\..*경험 카드를 만드는 중…/,
    );
    expect(out).not.toContain('LEFT JOIN이 헷갈려요');
  });

  it('shows the conversation title before any field arrives', () => {
    const out = sidebar({
      conversationId: 'c-now',
      title: 'LEFT JOIN이 헷갈려요',
    });
    expect(out).toContain('<span class="t">LEFT JOIN이 헷갈려요</span>');
    expect(out).not.toContain('class="sum"');
  });

  it('updates a done item while its card is made again', () => {
    const out = sidebar({
      conversationId: 'c-done',
      title: '예전 제목',
      fields: { title: '새 제목', summary: '새 요약' },
    });
    expect(out).toMatch(/새 제목.*새 요약.*카드를 다시 만드는 중…/);
  });
});
