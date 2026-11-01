import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatPanel } from '../../src/renderer/ChatPanel';
import {
  savedLinesBefore,
  toolLineText,
  withToolEvent,
} from '../../src/renderer/ToolLines';
import type {
  ConversationView,
  ToolCallView,
  ToolEvent,
} from '../../src/shared/ipc';

const label = '내 경험 카드 검색';
const call = (afterMessage: number, count: number | null): ToolCallView => ({
  afterMessage,
  name: 'search_experience_cards',
  label,
  query: 'JOIN',
  count,
});
const event = (status: ToolEvent['status'], count?: number): ToolEvent => ({
  streamId: 's',
  conversationId: 'c',
  callId: 'call_1',
  name: 'search_experience_cards',
  label,
  query: 'JOIN',
  status,
  count,
});

function panel(
  conversation: Partial<ConversationView>,
  streaming?: Parameters<typeof ChatPanel>[0]['streamingTools'],
) {
  return renderToStaticMarkup(
    createElement(ChatPanel, {
      subjectTitle: 'SQLD',
      conversation: {
        id: 'c',
        subjectId: 's',
        title: '대화',
        messages: [],
        cardId: null,
        saved: true,
        model: null,
        toolCalls: [],
        ...conversation,
      },
      streamingText: streaming ? '' : null,
      streamingTools: streaming ?? [],
      banner: null,
      input: '',
      inputRef: { current: null },
      headAction: null,
      modelPicker: null,
      onInput: () => {},
      onSend: () => {},
      onStop: () => {},
      onNewConversation: () => {},
      onOpenUsage: () => {},
      onFold: () => {},
    }),
  );
}

describe('toolLineText', () => {
  it('reads label, query and what came back', () => {
    expect(
      toolLineText({ label, query: 'JOIN', status: 'done', count: 3 }),
    ).toBe("내 경험 카드 검색 · 'JOIN' · 3장");
    expect(toolLineText({ label, query: ' JOIN ', status: 'running' })).toBe(
      "내 경험 카드 검색 · 'JOIN' · 찾는 중…",
    );
    expect(toolLineText({ label, query: 'JOIN', status: 'error' })).toBe(
      "내 경험 카드 검색 · 'JOIN' · 검색하지 못했어요",
    );
  });

  it('leaves out an empty query', () => {
    expect(toolLineText({ label, query: '', status: 'done', count: 0 })).toBe(
      '내 경험 카드 검색 · 0장',
    );
  });
});

describe('withToolEvent', () => {
  it('adds a running call and replaces it when it finishes', () => {
    const running = withToolEvent([], event('running'));
    expect(running).toEqual([
      { callId: 'call_1', label, query: 'JOIN', status: 'running' },
    ]);
    const done = withToolEvent(running, event('done', 2));
    expect(done).toEqual([
      { callId: 'call_1', label, query: 'JOIN', status: 'done', count: 2 },
    ]);
    expect(
      withToolEvent(done, { ...event('running'), callId: 'call_2' }),
    ).toHaveLength(2);
  });
});

describe('savedLinesBefore', () => {
  it('puts a call with the message after it and marks a failed one', () => {
    const calls = [call(0, 1), call(2, null)];
    expect(savedLinesBefore(calls, 1)).toEqual([
      { label, query: 'JOIN', status: 'done', count: 1 },
    ]);
    expect(savedLinesBefore(calls, 3)).toEqual([
      { label, query: 'JOIN', status: 'error', count: undefined },
    ]);
    expect(savedLinesBefore(calls, 2)).toEqual([]);
  });
});

describe('ChatPanel tool lines', () => {
  const messages: ConversationView['messages'] = [
    { role: 'user', text: '내 카드에서 JOIN 찾아줘' },
    { role: 'assistant', text: '1장을 찾았어요' },
    { role: 'user', text: '고마워요' },
    { role: 'assistant', text: '천만에요' },
  ];

  it('shows a saved call inside the answer it led to, above the text', () => {
    const out = panel({ messages, toolCalls: [call(0, 1)] });
    expect(out.match(/class="tool-line /g)).toHaveLength(1);
    const line = out.indexOf('내 경험 카드 검색 · &#x27;JOIN&#x27; · 1장');
    expect(line).toBeGreaterThan(out.indexOf('내 카드에서 JOIN 찾아줘'));
    expect(line).toBeGreaterThan(out.indexOf('class="msg-ai"'));
    expect(line).toBeLessThan(out.indexOf('1장을 찾았어요'));
    expect(out).toContain('role="status"');
  });

  it('shows a call with no answer after it on its own before the next question', () => {
    const out = panel({
      messages: [messages[0], messages[2], messages[3]],
      toolCalls: [call(0, null)],
    });
    const line = out.indexOf('검색하지 못했어요');
    expect(line).toBeGreaterThan(out.indexOf('내 카드에서 JOIN 찾아줘'));
    expect(line).toBeLessThan(out.indexOf('고마워요'));
    expect(out.indexOf('class="msg-ai"')).toBeGreaterThan(line);
  });

  it('shows the live call above the streaming answer', () => {
    const out = panel({ messages: [messages[0]] }, [
      { label, query: 'JOIN', status: 'running' },
    ]);
    const live = out.indexOf('aria-live="polite"');
    expect(live).toBeGreaterThan(-1);
    expect(out.indexOf('찾는 중…')).toBeGreaterThan(live);
    expect(out).toContain('class="spin"');
  });
});
